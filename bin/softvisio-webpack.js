#!/usr/bin/env node

import CLI from "#core/cli";
import WebpackRunner from "#lib/webpack";

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
            "description": `Inject webpack bundle analyzer. Static report file will be created in the output dir after each compilation.`,
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

await CLI.parse( cli );

const webpackRunner = new WebpackRunner( {
    "command": process.cli.arguments.command,
    "mode": process.cli.options.mode,
    "cordova": process.cli.options.cordova,
    "analyzer": process.cli.options.analyzer,
} );

webpackRunner.run();
