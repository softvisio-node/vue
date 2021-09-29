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

await CLI.parse( spec );

env.readConfig( { "configPrefix": ".env", "envPrefix": "VUE_" } );

// XXX
// load env
// load webpack config

const config = await import( new URL( "webpack.config.js", url.pathToFileURL( env.root + "/" ) ) );

webpack( config.default, ( err, stats ) => {

    // [Stats Object](#stats-object)
    if ( err || stats.hasErrors() ) {
        console.log( err );
    }

    console.log( "DONE" );
} );
