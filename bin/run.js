#!/usr/bin/env node

import CLI from "#core/cli";
import env from "#core/env";
import url from "url";
import webpack from "webpack";

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

    // public
    async run () {
        await CLI.parse( spec );

        env.readConfig( { "configPrefix": ".env", "envPrefix": "VUE_" } );

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
            const config = await import( new URL( "webpack.config.js", url.pathToFileURL( env.root + "/" ) ) );

            this.#webpackConfig = config.default;
        }

        return this.#webpackConfig;
    }

    async #runServe () {

        // const webpackConfig = await this.#buildWebpackConfig();
    }

    async #runBuild () {
        const webpackConfig = await this.#buildWebpackConfig();

        return new Promise( resolve => {
            const compiler = webpack( webpackConfig );

            compiler.run( ( err, stats ) => {
                if ( err || stats.hasErrors() ) {

                    // error
                }

                console.log( stats + "" );

                compiler.close( closeErr => {
                    resolve();
                } );
            } );
        } );
    }
}

const run = new Run();

await run.run();
