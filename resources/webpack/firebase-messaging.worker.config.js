import WebpackConfig from "#lib/webpack/config";
import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import { resolve } from "#core/utils";
import fs from "node:fs";

const DefinePlugin = webpack.DefinePlugin;

const worker = resolve( "#lib/firebase/messaging/web.worker", import.meta.url );

export class FirebaseMessagingWorker extends WebpackConfig {
    constructor ( options ) {
        super( options );

        this.addSchema( new URL( "../schemas/env.firebase-messaging.worker.schema.yaml", import.meta.url ) );
    }

    // properties
    get name () {
        return "firebaseMessagingWorker";
    }

    get isEnabled () {
        if ( !super.isEnabled ) return false;

        if ( this.isCordova ) return false;

        if ( !this.appConfig.firebase?.web ) return false;

        return true;
    }

    // protected
    _prepare () {
        super._prepare();

        this.preprocessorParams.firebaseMessagingWorkerEnabled = this.isEnabled;

        this.preprocessorParams.firebaseMessagingWorkerMixin = fs.existsSync( this.context + "/src/firebase-messaging.worker.js" ) ? true : false;
    }

    _generate ( options ) {
        return {
            "target": "webworker",
            "mode": this.mode,
            "context": this.context,
            "devtool": this.isDevelopment ? "eval-source-map" : undefined,
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
                    "process.env": options.appEnv,
                    "process._APP_CONFIG_PLACEHOLDER": options.appConfig,
                } ),
            ],
        };
    }
}
