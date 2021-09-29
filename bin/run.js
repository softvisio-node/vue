#!/usr/bin/env node

import "#core/result";
import CLI from "#core/cli";
import env from "#core/env";
import url from "url";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import fs from "fs";
import path from "path";

const DEV_SERVER_OPTIONS = {
    "host": process.env.DEVSERVER_HOST || "0.0.0.0",
    "port": process.env.DEVSERVER_PORT || "80",
    "allowedHosts": "all",
    "hot": true,
    "compress": false,
    "historyApiFallback": true,
};

const ENV_PREFIX = "VUE_";

const cli = {
    "title": "Webpack runner",
    "options": {
        "cordova": {
            "short": "c",
            "description": "build for cordova",
            "default": false,
            "schema": { "type": "boolean" },
        },
        "mode": {
            "short": "m",
            "description": `Can be "development" or "production".`,
            "default": "production",
            "schema": { "type": "string", "enum": ["development", "production"] },
        },
    },
    "arguments": {
        "command": {
            "description": `One of: "serve", "build"`,
            "required": true,
            "schema": { "type": "string", "enum": ["serve", "build"] },
        },
    },
};

class Run {
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
    // XXX set cordova variable
    async run () {
        await CLI.parse( cli );

        // set mode
        if ( process?.cli?.options.mode ) env.mode = process.cli.options.mode;

        env.readConfig( { "envPrefix": false } );

        if ( process.cli.arguments.command === "serve" ) {
            this.#runServe();
        }
        else {
            const res = await this.#runBuild();

            process.exit( res.ok ? 0 : 1 );
        }
    }

    // private
    async #buildWebpackConfig () {
        if ( !this.#webpackConfig ) {

            // set env variables
            process.env.WEBPACK_MODE = env.mode;
            process.env.WEBPACK_CONTEXT = this.context;
            process.env.WEBPACK_OUTPUT_PATH = this.output;
            process.env.WEBPACK_RESOLVE_MODULES = JSON.stringify( [

                //
                "node_modules",
                path.join( this.context, "node_modules" ),
            ] );
            process.env.WEBPACK_RESOLVE_ALIAS = JSON.stringify( {
                "@": path.join( this.context, "src" ),
            } );
            process.env.WEBPACK_RESOLVE_LOADER_MODULES = JSON.stringify( [

                //
                "node_modules",
                path.join( this.context, "node_modules" ),
            ] );

            process.env.WEBPACK_ENV = JSON.stringify( this.#getWebpackEnv() );

            process.env.WEBPACK_TERSER_OPTIONS = JSON.stringify( this.#getWebpackTerserOptions() );

            const webpackConfig = await import( new URL( "webpack.config.js", url.pathToFileURL( env.root + "/" ) ) );

            this.#webpackConfig = Array.isArray( webpackConfig.default ) ? webpackConfig.default : [webpackConfig.default];
        }

        // console.log( process.env.WEBPACK_ENV );
        // console.log( this.#webpackConfig[0].plugins[4]);
        // process.exit();

        return this.#webpackConfig;
    }

    #getWebpackEnv () {
        const _env = {
            "NODE_ENV": env.mode,
            "BASE_URL": "",
        };

        for ( const name in process.env ) {
            if ( name.startsWith( ENV_PREFIX ) ) _env[name] = process.env[name];
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
            },
            "parallel": true,
            "extractComments": false,
        };
    }

    async #runServe () {
        const webpackConfig = await this.#buildWebpackConfig();

        const compiler = webpack( webpackConfig );

        const server = new WebpackDevServer( DEV_SERVER_OPTIONS, compiler );

        server.startCallback( () => {} );
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
}

const run = new Run();

run.run();
