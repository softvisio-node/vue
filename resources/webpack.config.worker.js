import webpack from "webpack";
import TerserPlugin from "terser-webpack-plugin";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";

const DefinePlugin = webpack.DefinePlugin;

const worker = {
    "mode": process.env.WEBPACK_MODE,
    "context": process.env.WEBPACK_CONTEXT,
    "target": "webworker",
    "devtool": false,

    "output": {
        "path": process.env.WEBPACK_OUTPUT_PATH,
        "filename": "firebase-messaging-sw.js",
        "publicPath": "auto",
    },

    "experiments": {
        "topLevelAwait": true,
    },

    "entry": {
        "firebase": {
            "import": "./src/firebase-messaging-sw.js",
            "filename": "firebase-messaging-sw.js",
            "publicPath": "/",
        },
    },

    // https://webpack.js.org/configuration/cache/
    "cache": {
        "type": "filesystem",
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

    "plugins": [

        //
        new CaseSensitivePathsPlugin(),

        new DefinePlugin( {
            "process.env": process.env.WEBPACK_ENV,
        } ),
    ],

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
                "exclude": [

                    //
                    /node_modules/,
                ],
                "use": [
                    {
                        "loader": "babel-loader",
                        "options": {
                            "cacheCompression": false,
                            "cacheDirectory": "node_modules/.cache/babel-loader",
                            "cacheIdentifier": "80c0301a",
                        },
                    },
                ],
            },
        ],
    },
};

export default [worker];
