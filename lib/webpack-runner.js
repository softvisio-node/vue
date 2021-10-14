import "#core/result";
import ansi from "#core/text/ansi";
import env from "#core/env";
import url from "url";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import fs from "fs";
import path from "path";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import { TmpDir } from "#core/tmp";

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
    #cordova;
    #analyzer;
    #cache;
    #buildTag;
    #webpackConfig;
    #context;
    #output;
    #tmp;

    constructor ( options ) {
        this.#command = options.command;
        this.#analyzer = options.analyzer;
        this.#cache = options.cache;

        // mode
        if ( this.#command === "serve" ) {
            env.mode = options.mode ?? "development";

            process.env.WEBPACK_DEV_SERVER = 1;
        }
        else {
            env.mode = options.mode ?? "production";

            process.env.WEBPACK_DEV_SERVER = "";
        }

        // cordova
        if ( options.cordova ) {
            this.#cordova = true;

            process.env.WEBPACK_BUILD_CORDOVA = 1;
        }
        else {
            this.#cordova = false;

            process.env.WEBPACK_BUILD_CORDOVA = "";
        }
    }

    // properties
    get buildTag () {
        this.#buildTag ??= [this.#command, env.mode, this.#cordova ? "cordova" : null].filter( tag => tag ).join( "." );

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
        return `${ansi.ok( ` ${env.mode.toUpperCase()} ` )}${this.#cordova ? `, ${ansi.ok( ` CORDOVA ` )}` : ""}`;
    }

    get tmp () {
        this.#tmp ??= new TmpDir();

        return this.#tmp.path;
    }

    // public
    async run () {
        env.readConfig( { "path": this.context, "envPrefix": false } );

        this.#printCompilationStart();

        // run
        if ( this.#command === "serve" ) {
            this.#runServe();
        }
        else if ( this.#command === "build" ) {
            const res = await this.#runBuild();

            process.exit( res.ok ? 0 : 1 );
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
                "TMP_PATH": this.tmp,
                "RESOLVE_ALIAS": {
                    "@": path.join( this.context, "src" ),
                    "#tmp": this.tmp,
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
                config.stats = "none";

                // patch cache
                if ( !this.#cache ) config.cache = false;
                else config.cache = { ...config.cache, "name": path.join( this.buildTag, config.name ) };

                // inject webpack bundle analyzer
                if ( this.#analyzer ) {
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

        const plugin = {
            "apply": compiler => {
                compiler.hooks.compile.tap( "run", () => {
                    console.clear();

                    this.#printCompilationStart();
                } );

                compiler.hooks.assetEmitted.tap( "run", ( file, info ) => {

                    // store to the tmp location
                    if ( info.targetPath.startsWith( this.tmp ) ) {
                        fs.mkdirSync( path.dirname( info.targetPath ), { "recursive": true } );

                        fs.writeFileSync( info.targetPath, info.content );
                    }
                } );
            },
        };

        // patch config
        for ( const config of webpackConfig ) {

            // supress webpack-dev-server logging
            config.infrastructureLogging ??= {};
            config.infrastructureLogging.level = "none";

            config.plugins.push( plugin );
        }

        const compiler = webpack( webpackConfig ),
            server = new WebpackDevServer( DEV_SERVER_OPTIONS, compiler );

        compiler.hooks.done.tap( "run", stats => {
            console.clear();

            // error
            if ( stats.hasErrors() ) {
                console.log( stats.toString( { "preset": "errors-warnings", "colors": true } ) );

                this.#printCompilationReport( true );
            }

            // ok
            else {
                console.log( stats.toString( { "preset": "summary", "colors": true } ) );

                this.#printCompilationReport();
            }
        } );

        await server.start();
    }

    async #runBuild () {

        // cleanup output dir
        this.#cleanOutputDir();

        const webpackConfig = await this.#buildWebpackConfig();

        return new Promise( resolve => {
            const compiler = webpack( webpackConfig );

            compiler.run( ( error, stats ) => {
                const res = error || stats.hasErrors() ? result( 500 ) : result( 200 );

                compiler.close( closeErr => {
                    console.log( "\n" );
                    console.log( stats.toString( { "preset": "normal", "colors": true } ) );

                    this.#printCompilationReport( !res.ok );

                    resolve( res );
                } );
            } );
        } );
    }

    async #runDump () {
        const webpackConfig = await this.#buildWebpackConfig();

        console.log( JSON.stringify( webpackConfig, null, 4 ) );
    }

    #printCompilationStart () {
        process.stdout.write( ansi.hl( "• Building for: " ) + this.buildTargets + " ... " );
    }

    #printCompilationReport ( error ) {
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

        if ( !error && this.#analyzer ) console.log( " ", `Webpack bundle analyzer reports were created in the output directory` );
    }

    #cleanOutputDir () {
        fs.rmSync( this.output, { "force": true, "recursive": true } );
    }
}
