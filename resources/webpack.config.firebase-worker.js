import env from "#core/env";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";
import { resolve } from "#core/utils";

const DefinePlugin = webpack.DefinePlugin;

const worker = resolve( "@softvisio/vue-ext/firebase/worker", import.meta.url );

const config = {
    "name": "firebase-worker",
    "target": "webworker",
    "mode": process.env.WEBPACK_MODE,
    "context": process.env.WEBPACK_CONTEXT,
    "devtool": env.isDevelopment ? "eval" : undefined,
    "experiments": { "topLevelAwait": true },
    "cache": JSON.parse( process.env.WEBPACK_CACHE ),

    "entry": {
        "firebase": {
            "import": worker,
            "filename": "firebase-messaging-sw.js",
        },
    },

    "output": {
        "path": process.env.WEBPACK_OUTPUT_PATH,
        "publicPath": "auto",
    },

    "resolve": {
        "alias": {
            ...JSON.parse( process.env.WEBPACK_RESOLVE_ALIAS ),
            "#vue": "@softvisio/vue-ext",
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

        "modules": JSON.parse( process.env.WEBPACK_RESOLVE_MODULES ),
    },

    "resolveLoader": { "modules": JSON.parse( process.env.WEBPACK_RESOLVE_LOADER_MODULES ) },

    "optimization": {
        "minimizer": [new TerserPlugin( JSON.parse( process.env.WEBPACK_TERSER_OPTIONS ) )],
    },

    "module": {
        "rules": [

            // esm
            {
                "test": /\.m?jsx?$/,
                "resolve": {
                    "fullySpecified": false,
                },
            },

            // js
            {
                "test": /\.m?jsx?$/,
                "exclude": [],
                "use": [
                    "thread-loader",
                    {
                        "loader": "babel-loader",
                        "options": JSON.parse( process.env.WEBPACK_BABEL_OPTIONS ),
                    },
                ],
            },
        ],
    },

    "plugins": [
        new CaseSensitivePathsPlugin(),

        new DefinePlugin( {
            "process.env": process.env.WEBPACK_ENV,
        } ),
    ],
};

export default config;
