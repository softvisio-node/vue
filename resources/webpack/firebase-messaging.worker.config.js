import WebpackConfig from "#lib/webpack/config";
import env from "#core/env";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { resolve } from "#core/utils";

const DefinePlugin = webpack.DefinePlugin;

const worker = resolve( "#lib/firebase/firebase-messaging.worker", import.meta.url );

export class FirebaseMessagingWorker extends WebpackConfig {
    #schemas = [

        //
        new URL( "../schemas/env.firebase-messaging.worker.schema.yaml", import.meta.url ),
    ];

    // properties
    get name () {
        return "firebaseMessagingWorker";
    }

    get schemas () {
        return [...super.schemas, ...this.#schemas];
    }

    get isEnabled () {
        if ( !super.isEnabled ) return false;

        if ( !this.config.firebase?.browser ) return false;

        return true;
    }

    // public
    prepare () {
        super.prepare();

        this.preprocessorParams.firebaseMessagingWorkerEnabled = this.isEnabled;
    }

    generate ( options ) {
        return {
            "target": "webworker",
            "mode": options.mode,
            "context": this.context,
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
                        "use": [
                            {
                                "loader": "babel-loader",
                                "options": options.babelOptions,
                            },
                            {
                                "loader": "webpack-preprocessor-loader",
                                "options": options.preprocessorOptions,
                            },
                        ],
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
    }
}
