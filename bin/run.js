#!/usr/bin/env node

import CLI from "#core/cli";
import env from "#core/env";
import url from "url";
import webpack from "webpack";
import fs from "fs";
import path from "path";

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
    async run () {
        await CLI.parse( spec );

        // set mode
        if ( process?.cli?.options.mode ) env.mode = process.cli.options.mode;

        env.readConfig( { "configPrefix": ".env", "envPrefix": false } );

        if ( process.cli.arguments.command === "serve" ) {
            return this.#runServe();
        }
        else {
            return this.#runBuild();
        }
    }

    // private
    async #buildWebpackConfig () {
        if ( !this.#webpackConfig ) {
            const webpackConfig = await import( new URL( "webpack.config.js", url.pathToFileURL( env.root + "/" ) ) );

            this.#webpackConfig = Array.isArray( webpackConfig.default ) ? webpackConfig.default : [webpackConfig.default];

            for ( const config of this.#webpackConfig ) {
                config.mode = env.mode;
            }
        }

        return this.#webpackConfig;
    }

    // XXX
    async #runServe () {

        // const webpackConfig = await this.#buildWebpackConfig();

        return result( 500 );
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

const res = await run.run();

process.exit( res.ok ? 0 : 1 );
