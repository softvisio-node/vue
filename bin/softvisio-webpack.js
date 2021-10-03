#!/usr/bin/env node

import "#core/result";
import CLI from "#core/cli";
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
    "logLevel": "silent",
};

const cli = {
    "title": "Webpack runner",
    "options": {
        "mode": {
            "short": "m",
            "description": `can be "development" or "production"`,
            "schema": { "type": "string", "enum": ["development", "production"] },
        },
        "cordova": {
            "short": "c",
            "description": "build for cordova",
            "default": false,
            "schema": { "type": "boolean" },
        },
        "analyzer": {
            "short": "a",
            "description": `run with webpack bundle analyzer`,
            "default": false,
            "schema": { "type": "boolean" },
        },
    },
    "arguments": {
        "command": {
            "description": `One of: "serve", "build", "dump"`,
            "required": true,
            "schema": { "type": "string", "enum": ["serve", "build", "dump"] },
        },
    },
};

class Runner {
    #webpackConfig;
    #context;
    #output;

    // properties
    get context () {
        this.#context ??= path.resolve( "." );

        return this.#context;
    }

    get output () {
        this.#output ??= path.join( this.context, "www" );

        return this.#output;
    }

    // public
    async run () {
        await CLI.parse( cli );

        process.env.WEBPACK_BUILD_CORDOVA = process.cli?.options?.cordova ? 1 : "";

        // set mode
        if ( process.cli.arguments.command === "serve" ) {
            env.mode = process.cli?.options?.mode ?? "development";
        }
        else {
            env.mode = process.cli?.options?.mode ?? "production";
        }

        env.readConfig( { "path": this.context, "envPrefix": false } );

        if ( process.cli.arguments.command === "serve" ) {
            this.#runServe();
        }
        else if ( process.cli.arguments.command === "build" ) {
            const res = await this.#runBuild();

            process.exit( res.ok ? 0 : 1 );
        }
        else if ( process.cli.arguments.command === "dump" ) {
            await this.#runDump();

            process.exit( 0 );
        }
    }

    // private
    async #buildWebpackConfig () {
        if ( !this.#webpackConfig ) {

            // set env variables
            process.env.WEBPACK_MODE = env.mode;
            process.env.WEBPACK_CONTEXT = this.context;
            process.env.WEBPACK_CACHE = JSON.stringify( CACHE_OPTIONS );
            process.env.WEBPACK_OUTPUT_PATH = this.output;

            process.env.WEBPACK_RESOLVE_MODULES = JSON.stringify( [

                //
                path.join( this.context, "node_modules" ),
            ] );

            process.env.WEBPACK_RESOLVE_ALIAS = JSON.stringify( {
                "@": path.join( this.context, "src" ),
            } );

            process.env.WEBPACK_RESOLVE_LOADER_MODULES = JSON.stringify( [

                //
                path.join( this.context, "node_modules" ),
            ] );

            process.env.WEBPACK_ENV = JSON.stringify( this.#getWebpackEnv() );

            process.env.WEBPACK_TERSER_OPTIONS = JSON.stringify( this.#getWebpackTerserOptions() );

            const webpackConfig = await import( new URL( "webpack.config.js", url.pathToFileURL( this.context + "/" ) ) );

            this.#webpackConfig = Array.isArray( webpackConfig.default ) ? webpackConfig.default : [webpackConfig.default];

            // config post-processing
            for ( const config of this.#webpackConfig ) {
                if ( !config.name ) throw Error( `Webpack config name is required` );

                // inject webpack bundle analyzer
                if ( process.cli?.options?.analyzer || process.env.WEBPACK_DEV_SERVER || env.isDevelopment ) {
                    config.plugins.push( new BundleAnalyzerPlugin( {
                        ...BUNDLE_ANALYZER_OPTIONS,
                        "reportFilename": `bundle-analyzer.${config.name}.${env.mode}.html`,
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

    #getWebpackTerserOptions () {
        return {
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
    }

    async #runServe () {
        process.env.WEBPACK_DEV_SERVER = 1;

        const webpackConfig = await this.#buildWebpackConfig();

        // supress webpack-dev-server logging
        webpackConfig[0].infrastructureLogging ??= {};
        webpackConfig[0].infrastructureLogging.level = "none";

        // output only compilation errors
        webpackConfig[0].stats = "errors-warnings";

        const compiler = webpack( webpackConfig ),
            server = new WebpackDevServer( DEV_SERVER_OPTIONS, compiler );

        let firstCompile = true;

        compiler.hooks.done.tap( "run", stats => {
            if ( firstCompile ) {
                firstCompile = false;

                console.log( `done` );
                console.log( `Listening on: http://${DEV_SERVER_OPTIONS.host}:${DEV_SERVER_OPTIONS.port}` );
                console.log( `Press CTRL+C to terminate` );
                console.log( "" );
            }
        } );

        process.stdout.write( `Compiling ... ` );

        await server.start();
    }

    async #runBuild () {

        // cleanup output dir
        fs.rmSync( this.output, { "force": true, "recursive": true } );

        const webpackConfig = await this.#buildWebpackConfig();

        return new Promise( resolve => {
            const compiler = webpack( webpackConfig );

            compiler.run( ( err, stats ) => {
                console.log( stats + "" );

                const res = err || stats.hasErrors() ? result( 500 ) : result( 200 );

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
}

const runner = new Runner();

runner.run();
