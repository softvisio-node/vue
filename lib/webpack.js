import "#core/result";
import ansi from "#core/text/ansi";
import env from "#core/env";
import url from "url";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import fs from "fs";
import path from "path";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const CACHE_OPTIONS = {
    "type": "filesystem",
    "compression": "brotli",
    "maxAge": 1000 * 60 * 60 * 24 * 3, // 3 days
    "maxMemoryGenerations": 1,
};

const DEV_SERVER_OPTIONS = {
    "host": process.env.DEVSERVER_HOST || "0.0.0.0",
    "port": process.env.DEVSERVER_PORT || "80",
    "allowedHosts": "all",
    "hot": true,
    "compress": false,
    "historyApiFallback": true,
    "setupExitSignals": true,
    "client": {
        "logging": "none",
        "progress": true,
        "overlay": {
            "errors": true,
            "warnings": false,
        },
    },
};

const BUNDLE_ANALYZER_OPTIONS = {
    "analyzerMode": "static",
    "openAnalyzer": false,
    "logLevel": "warn",
};

const BABEL_PRESET_ENV_OPTIONS = [
    "@babel/preset-env",
    {
        "bugfixes": true,
        "corejs": 3,
        "loose": false,
        "debug": false,
        "modules": false,
        "targets": {},
        "useBuiltIns": "usage",
        "ignoreBrowserslistConfig": undefined,
        "exclude": ["es.array.iterator", "es.promise", "es.object.assign", "es.promise.finally"],
        "shippedProposals": true,
    },
];

const BABEL_OPTIONS = {
    "compact": false,
    "sourceType": "unambiguous",

    // NOTE https://github.com/babel/babel/issues/9903
    // NOTE https://github.com/babel/babel/discussions/13826
    "exclude": [/@babel(\/|\\)runtime/, /core-js/],
    "presets": [BABEL_PRESET_ENV_OPTIONS],
    "plugins": [
        [
            "@babel/plugin-transform-runtime",
            {
                "regenerator": false, // useBuiltIns !== "usage"
                "corejs": false, // 3, polyfills are injected by preset-env & polyfillsPlugin, so no need to add them again
                "helpers": true, // useBuiltIns === "usage",
                "useESModules": true, // !process.env.VUE_CLI_BABEL_TRANSPILE_MODULES,
            },
        ],
    ],
};

const TERSER_OPTIONS = {
    "terserOptions": {
        "compress": {
            "arrows": false,
            "collapse_vars": false,
            "comparisons": false,
            "computed_props": false,
            "hoist_funs": false,
            "hoist_props": false,
            "hoist_vars": false,
            "inline": false,
            "loops": false,
            "negate_iife": false,
            "properties": false,
            "reduce_funcs": false,
            "reduce_vars": false,
            "switches": false,
            "toplevel": false,
            "typeofs": false,
            "booleans": true,
            "if_return": true,
            "sequences": true,
            "unused": true,
            "conditionals": true,
            "dead_code": true,
            "evaluate": true,
        },
        "mangle": {
            "safari10": true,
        },
        "format": {
            "comments": false,
        },
    },
    "parallel": true,
    "extractComments": false,
};

export default class WebpackRunner {
    #command;
    #buildCordova;
    #injectBundleAnalyzer;
    #buildTag;
    #webpackConfig;
    #context;
    #output;

    constructor () {
        this.#command = process.cli?.arguments?.command;

        // mode
        if ( this.#command === "serve" ) {
            env.mode = process.cli?.options?.mode ?? "development";

            process.env.WEBPACK_DEV_SERVER = 1;
        }
        else {
            env.mode = process.cli?.options?.mode ?? "production";

            process.env.WEBPACK_DEV_SERVER = "";
        }

        // cordova
        if ( process.cli?.options?.cordova ) {
            this.#buildCordova = true;

            process.env.WEBPACK_BUILD_CORDOVA = 1;
        }
        else {
            this.#buildCordova = false;

            process.env.WEBPACK_BUILD_CORDOVA = "";
        }

        this.#injectBundleAnalyzer = process.cli?.options?.analyzer;
    }

    // properties
    get buildTag () {
        this.#buildTag ??= [this.#command, env.mode, this.#buildCordova ? "cordova" : null].filter( tag => tag ).join( "." );

        return this.#buildTag;
    }

    get context () {
        this.#context ??= path.resolve( "." );

        return this.#context;
    }

    get output () {
        this.#output ??= path.join( this.context, "www" );

        return this.#output;
    }

    get buildTargets () {
        return `${ansi.ok( ` ${env.mode.toUpperCase()} ` )}${this.#buildCordova ? `, ${ansi.ok( ` CORDOVA ` )}` : ""}`;
    }

    // public
    async run () {
        env.readConfig( { "path": this.context, "envPrefix": false } );

        console.log( ansi.hl( "• Building for:" ), this.buildTargets, "\n" );

        // run
        if ( this.#command === "serve" ) {
            this.#runServe();
        }
        else if ( this.#command === "build" ) {
            const res = await this.#runBuild();

            // ok
            if ( res.ok ) {
                this.#printReport();

                // console.log( "\n", ansi.hl( "• Build status:" ), ansi.ok( ` SUCCESS ` ) );
                // if ( this.#injectBundleAnalyzer ) console.log( " ", `Webpack bundle analyzer reports were created in the output directory` );
                // console.log( "" );

                process.exit( 0 );
            }

            // error
            else {
                this.#printReport( true );

                // console.log( "\n", ansi.hl( "• Build status:" ), ansi.error( ` FAIL ` ) );
                // console.log( "" );

                process.exit( 1 );
            }
        }
        else if ( this.#command === "dump" ) {
            await this.#runDump();

            process.exit( 0 );
        }
    }

    // private
    async #buildWebpackConfig () {
        if ( !this.#webpackConfig ) {

            // set env variables
            global.WEBPACK = {
                "MODE": env.mode,
                "CONTEXT": this.context,
                CACHE_OPTIONS,
                "OUTPUT_PATH": this.output,
                "RESOLVE_ALIAS": {
                    "@": path.join( this.context, "src" ),
                },
                "RESOLVE_MODULES": [path.join( this.context, "node_modules" )],
                "RESOLVE_LOADER_MODULES": [path.join( this.context, "node_modules" )],
                TERSER_OPTIONS,
                BABEL_OPTIONS,
                "ENV": JSON.stringify( this.#getWebpackEnv() ),
            };

            const webpackConfig = await import( new URL( "webpack.config.js", url.pathToFileURL( this.context + "/" ) ) );

            delete global.WEBPACK;

            this.#webpackConfig = Array.isArray( webpackConfig.default ) ? webpackConfig.default : [webpackConfig.default];

            // patch config
            for ( const config of this.#webpackConfig ) {
                if ( !config.name ) throw Error( `Webpack config name is required` );

                // patch stats
                config.stats ||= {};
                config.stats.colors = true;

                // patch cache name
                config.cache.name = `${config.name}.${this.buildTag}`;

                // inject webpack bundle analyzer
                if ( this.#injectBundleAnalyzer ) {
                    config.plugins.push( new BundleAnalyzerPlugin( {
                        ...BUNDLE_ANALYZER_OPTIONS,
                        "reportFilename": `report.${config.name}.${this.buildTag}.html`,
                        "reportTitle": `${config.name} [${env.mode}] ${new Date().toISOString()}`,
                    } ) );
                }
            }
        }

        return this.#webpackConfig;
    }

    #getWebpackEnv () {
        const _env = {
            "NODE_ENV": env.mode,
        };

        for ( const name in process.env ) {
            if ( name.startsWith( "APP_" ) ) _env[name] = process.env[name];
        }

        return _env;
    }

    async #runServe () {
        const webpackConfig = await this.#buildWebpackConfig();

        // patch config
        for ( const config of webpackConfig ) {

            // supress webpack-dev-server logging
            config.infrastructureLogging ??= {};
            config.infrastructureLogging.level = "none";

            // output only compilation errors
            config.stats ||= {};
            config.stats.preset = "none";
        }

        const compiler = webpack( webpackConfig ),
            server = new WebpackDevServer( DEV_SERVER_OPTIONS, compiler );

        compiler.hooks.done.tap( "run", stats => {
            console.clear();

            // error
            if ( stats.hasErrors() ) {
                console.log( stats.toString( { "preset": "errors-warnings", "colors": true } ) );

                this.#printReport( true );
            }

            // ok
            else {
                console.log( stats.toString( { "preset": "summary", "colors": true } ) );

                this.#printReport();
            }
        } );

        await server.start();
    }

    async #runBuild () {

        // cleanup output dir
        fs.rmSync( this.output, { "force": true, "recursive": true } );

        const webpackConfig = await this.#buildWebpackConfig();

        return new Promise( resolve => {
            const compiler = webpack( webpackConfig );

            compiler.run( ( error, stats ) => {
                console.log( stats + "" );

                const res = error || stats.hasErrors() ? result( 500 ) : result( 200 );

                compiler.close( closeErr => {
                    resolve( res );
                } );
            } );
        } );
    }

    async #runDump () {
        const webpackConfig = await this.#buildWebpackConfig();

        console.log( JSON.stringify( webpackConfig, null, 4 ) );
    }

    #printReport ( error ) {
        console.log( "" );

        // error
        if ( error ) {
            console.log( ansi.hl( "• Compilation status:" ), ansi.error( ` FAIL ` ) + ",", "targets:", this.buildTargets );
        }

        // ok
        else {
            console.log( ansi.hl( "• Compilation status:" ), ansi.ok( ` SUCCESS ` ) + ",", "targets:", this.buildTargets );
        }

        if ( this.#command === "serve" ) console.log( " ", `Webpack dev. server listening on: ${ansi.hl( `http://${DEV_SERVER_OPTIONS.host}:${DEV_SERVER_OPTIONS.port}` )}` );

        if ( !error && this.#injectBundleAnalyzer ) console.log( " ", `Webpack bundle analyzer reports were created in the output directory` );

        console.log( "" );
    }
}
