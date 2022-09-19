#!/usr/bin/env node

import CLI from "#core/cli";
import Webpack from "#lib/webpack";

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
        "cache": {

            // "short": "C",
            "description": `disable webpack cache`,
            "default": true,
            "schema": { "type": "boolean" },
        },
        "listen": {
            "short": "l",
            "description": `Development server listen IP address.`,
            "default": "0.0.0.0",
            "schema": { "type": "string", "format": "ip-address" },
        },
        "port": {
            "short": "p",
            "description": `Development server listen IP port.`,
            "default": 80,
            "schema": { "type": "number", "format": "ip-port" },
        },
    },
    "arguments": {
        "command": {
            "description": `One of: "dev", "build", "dump"`,
            "required": true,
            "schema": { "type": "string", "enum": ["dev", "build", "dump"] },
        },
    },
};

await CLI.parse( cli );

const webpack = new Webpack( {
    "mode": process.cli.options.mode,
    "command": process.cli.arguments.command,
    "analyzer": process.cli.options.analyzer,
    "cache": process.cli.options.cache,
    "cordova": process.cli.options.cordova,
    "listen": process.cli.options.listen,
    "port": process.cli.options.port,
} );

webpack.run();
