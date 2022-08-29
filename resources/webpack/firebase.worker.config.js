// this.#worker = await navigator.serviceworker.register( new url( "#tmp/firebase-messaging.worker.js", import.meta.url ), {
//     "scope": "/firebase-cloud-messaging-push-scope",
// } );

import WebpackConfig from "#lib/webpack/config";
import env from "#core/env";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { resolve } from "#core/utils";

const DefinePlugin = webpack.DefinePlugin;

const worker = resolve( "#lib/firebase/firebase.worker", import.meta.url );

const webpackConfig = new WebpackConfig().add( {
    "name": "firebaseWorker",
    "generator": options => {
        return {
            "target": "webworker",
            "mode": options.mode,
            "context": options.context,
            "devtool": env.isDevelopment ? "eval-source-map" : undefined,
            "experiments": { "topLevelAwait": true },
            "cache": options.cacheOptions,

            "entry": {
                "firebase": {
                    "import": worker,
                    "filename": "firebase-messaging.worker.js",
                },
            },

            "output": {
                "path": options.tmpPath,
                "publicPath": "auto",
            },

            "resolve": {
                "alias": {
                    ...options.resolveAlias,
                    "#vue": "@softvisio/vue",
                },

                // required by froala, can be replaced with crypto-browserify
                "fallback": {
                    "crypto": false,
                },

                "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

                "modules": options.resolveModules,
            },

            "resolveLoader": { "modules": options.resolveLoaderModules },

            "optimization": {
                "minimizer": [new TerserPlugin( options.terserOptions )],
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
                        "options": options.babelOptions,
                    },
                ],
            },

            "plugins": [
                new DefinePlugin( {
                    "process.env": options.env,
                    "process.config": options.config,
                } ),
            ],
        };
    },
    "schemas": [

        //
        new URL( "../schemas/env.main.schema.yaml", import.meta.url ),
        new URL( "../schemas/env.firebase.worker.schema.yaml", import.meta.url ),
    ],
} );

export default webpackConfig;
