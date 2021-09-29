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

const spec = {
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
        await CLI.parse( spec );

        // set mode
        if ( process?.cli?.options.mode ) env.mode = process.cli.options.mode;

        env.readConfig( { "configPrefix": ".env", "envPrefix": false } );

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
            const webpackConfig = await import( new URL( "webpack.config.js", url.pathToFileURL( env.root + "/" ) ) );

            this.#webpackConfig = Array.isArray( webpackConfig.default ) ? webpackConfig.default : [webpackConfig.default];

            for ( const config of this.#webpackConfig ) {
                config.mode = env.mode;
                config.context = this.context;
                config.output.path = this.output;
            }
        }

        return this.#webpackConfig;
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
