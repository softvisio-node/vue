#!/usr/bin/env node

import CLI from "#core/cli";
import env from "#core/env";
import url from "url";

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

console.log( new URL( "webpack.config.cjs", url.pathToFileURL( env.root + "/" ) ) + "" );

const c = await import( new URL( "webpack.config.cjs", url.pathToFileURL( env.root + "/" ) ) );

console.log( c );
