import env from "#core/env";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { resolve } from "#core/utils";

const DefinePlugin = webpack.DefinePlugin;

const worker = resolve( "#lib/firebase/worker", import.meta.url );

const config = {
    "name": "firebase-worker",
    "target": "webworker",
    "mode": global.WEBPACK.MODE,
    "context": global.WEBPACK.CONTEXT,
    "devtool": env.isDevelopment ? "eval-source-map" : undefined,
    "experiments": { "topLevelAwait": true },
    "cache": global.WEBPACK.CACHE_OPTIONS,

    "entry": {
        "firebase": {
            "import": worker,
            "filename": "firebase-messaging.worker.js",
        },
    },

    "output": {
        "path": global.WEBPACK.TMP_PATH,
        "publicPath": "auto",
    },

    "resolve": {
        "alias": {
            ...global.WEBPACK.RESOLVE_ALIAS,
            "#vue": "@softvisio/vue",
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

        "modules": global.WEBPACK.RESOLVE_MODULES,
    },

    "resolveLoader": { "modules": global.WEBPACK.RESOLVE_LOADER_MODULES },

    "optimization": {
        "minimizer": [new TerserPlugin( global.WEBPACK.TERSER_OPTIONS )],
    },

    "module": {
        "rules": [

            // js
            {
                "test": /\.[cm]?jsx?$/,
                "resolve": {
                    "fullySpecified": false,
                },
                "loader": "babel-loader",
                "options": global.WEBPACK.BABEL_OPTIONS,
            },
        ],
    },

    "plugins": [
        new DefinePlugin( {
            "process.env": global.WEBPACK.ENV,
        } ),
    ],
};

const schema = [new URL( "./schemas/app.env.firebase-worker.schema.yaml", import.meta.url )];

export { config, schema };
