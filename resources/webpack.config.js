import webpack from "webpack";
import { VueLoaderPlugin } from "vue-loader";
import HTMLPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";
import MiniCSSExtractPlugin from "mini-css-extract-plugin";
import CSSMinimizerPlugin from "css-minimizer-webpack-plugin";
import autoprefixer from "autoprefixer";

const DefinePlugin = webpack.DefinePlugin;

const app = {
    "devtool": false,

    "output": {
        "path": null,
        "filename": "js/[name].js",
        "publicPath": "",
        "chunkFilename": "js/[name].js",
    },

    "experiments": {
        "topLevelAwait": true,
    },

    "entry": {
        "app": "./src/main.js",
    },

    // https://webpack.js.org/configuration/cache/
    "cache": {
        "type": "filesystem",
    },

    "module": {
        "rules": [

            // esm
            // XXX ???
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
                    /[\\/]resources[\\/]ext-[\d.]+[\\/]/,
                    /[\\/]resources[\\/]ewc-[\d.]+[\\/]/,
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

            // vue
            {
                "test": /\.vue$/,
                "use": [
                    {
                        "loader": "vue-loader",
                        "options": {
                            "cacheDirectory": "node_modules/.cache/vue-loader",
                            "cacheIdentifier": "5e5cf8f2",
                            "babelParserPlugins": ["jsx", "classProperties", "decorators-legacy"],
                            "compilerOptions": {
                                "isCustomElement": tag => tag.startsWith( "ext-" ),
                            },
                        },
                    },
                ],
            },

            // vue-style
            {
                "test": /\.vue$/,
                "resourceQuery": /type=style/,
                "sideEffects": true,
            },

            // images
            {
                "test": /\.(png|jpe?g|gif|webp|avif)(\?.*)?$/,
                "use": [
                    {
                        "loader": "url-loader",
                        "options": {
                            "limit": 4096,
                            "esModule": true,
                            "fallback": {
                                "loader": "file-loader",
                                "options": {
                                    "name": "img/[name].[hash:8].[ext]",
                                    "esModule": true,
                                },
                            },
                        },
                    },
                ],
            },

            // svg
            {
                "test": /\.(svg)(\?.*)?$/,
                "use": [
                    {
                        "loader": "file-loader",
                        "options": {
                            "name": "img/[name].[hash:8].[ext]",
                            "esModule": true,
                        },
                    },
                ],
            },

            // media
            {
                "test": /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                "use": [
                    {
                        "loader": "url-loader",
                        "options": {
                            "limit": 4096,
                            "esmodule": true,
                            "fallback": {
                                "loader": "file-loader",
                                "options": {
                                    "name": "media/[name].[hash:8].[ext]",
                                    "esmodule": true,
                                },
                            },
                        },
                    },
                ],
            },

            // fonts
            {
                "test": /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
                "use": [
                    {
                        "loader": "url-loader",
                        "options": {
                            "limit": 4096,
                            "esModule": true,
                            "fallback": {
                                "loader": "file-loader",
                                "options": {
                                    "name": "fonts/[name].[hash:8].[ext]",
                                    "esModule": true,
                                },
                            },
                        },
                    },
                ],
            },

            // css
            {
                "test": /\.css$/,
                "use": [
                    {
                        "loader": "vue-style-loader",
                        "options": {
                            "sourceMap": false,
                            "shadowMode": false,
                        },
                    },
                    MiniCSSExtractPlugin.loader,
                    {
                        "loader": "css-loader",
                        "options": {
                            "sourceMap": false,
                            "importLoaders": 2,
                        },
                    },
                    {
                        "loader": "postcss-loader",
                        "options": {
                            "sourceMap": false,
                            "postcssOptions": {
                                "plugins": [autoprefixer()],
                            },
                        },
                    },
                ],
            },
        ],
    },

    "optimization": {
        "realContentHash": false,

        "splitChunks": {
            "cacheGroups": {
                "defaultVendors": {
                    "name": "chunk-vendors",
                    "test": /[\\/]node_modules[\\/]/,
                    "priority": -10,
                    "chunks": "initial",
                },
                "common": {
                    "name": "chunk-common",
                    "minChunks": 2,
                    "priority": -20,
                    "chunks": "initial",
                    "reuseExistingChunk": true,
                },
            },
        },

        "minimizer": [
            new TerserPlugin( {
                "terserOptions": {
                    "compress": {
                        "arrows": false,
                        "collapse_vars": false,
                        "comparisons": false,
                        "computed_props": false,
                        "hoist_funs": false,
                        "hoist_props": false,
                        "hoist_vars": false,
                        "inline": false,
                        "loops": false,
                        "negate_iife": false,
                        "properties": false,
                        "reduce_funcs": false,
                        "reduce_vars": false,
                        "switches": false,
                        "toplevel": false,
                        "typeofs": false,
                        "booleans": true,
                        "if_return": true,
                        "sequences": true,
                        "unused": true,
                        "conditionals": true,
                        "dead_code": true,
                        "evaluate": true,
                    },
                    "mangle": {
                        "safari10": true,
                    },
                },
                "parallel": true,
                "extractComments": false,
            } ),

            new CSSMinimizerPlugin( {
                "parallel": true,
                "minimizerOptions": {
                    "preset": [
                        "default",
                        {
                            "mergeLonghand": false,
                            "cssDeclarationSorter": false,
                        },
                    ],
                },
            } ),
        ],
    },

    "plugins": [
        new VueLoaderPlugin(),

        new MiniCSSExtractPlugin( {
            "filename": "css/[name].[contenthash:8].css",
            "chunkFilename": "css/[name].[contenthash:8].css",
        } ),

        new CaseSensitivePathsPlugin(),

        new DefinePlugin( {
            "__VUE_OPTIONS_API__": "true",
            "__VUE_PROD_DEVTOOLS__": "false",
        } ),

        new DefinePlugin( {
            "process.env": {

                // "NODE_ENV": '"development"', // XXX
                "VUE_APP_API_URL": '"//devel/api/?persistent=true&json=true"',
                "VUE_APP_BUILD_CORDOVA": '""',
                "VUE_APP_SIGNIN_PERMISSIONS": '""',
                "VUE_APP_THEME_ACCENT": '"red"',
                "VUE_APP_THEME_BASE": '"light-green"',
                "VUE_APP_THEME_DARK_MODE": '"auto"',
                "VUE_APP_TITLE": '"Rank Rocket"',
                "VUE_APP_TITLE_ICON": '"🚀"',
                "BASE_URL": '""',
            },
        } ),

        new HTMLPlugin( {
            "title": "rankrocket-ui",
            "scriptLoading": "defer",
            "template": "public/index.html",
            "templateParameters": {
                "NODE_ENV": "development",
                "BASE_URL": "",
                "VUE_APP_API_URL": "//devel/api/?persistent=true&json=true",
                "VUE_APP_BUILD_CORDOVA": "",
                "VUE_APP_SIGNIN_PERMISSIONS": "",
                "VUE_APP_THEME_ACCENT": "red",
                "VUE_APP_THEME_BASE": "light-green",
                "VUE_APP_THEME_DARK_MODE": "auto",
                "VUE_APP_TITLE": "Rank Rocket",
                "VUE_APP_TITLE_ICON": "🚀",
            },
        } ),

        new CopyPlugin( {
            "patterns": [
                {
                    "from": "public",
                    "globOptions": {
                        "ignore": ["**/index.html"],
                    },
                },
            ],
        } ),
    ],

    "resolve": {
        "alias": {
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue-ext",
            "#ext$": "@softvisio/ext/ext-" + process.env.EXT_VERSION,
            "#ext": "@softvisio/ext/resources/ext-" + process.env.EXT_VERSION,
            "#ewc$": "@softvisio/ext/ewc-" + process.env.EWC_VERSION,
            "#ewc": "@softvisio/ext/resources/ewc-" + process.env.EWC_VERSION,
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

        "modules": [

            //
            "node_modules",
            "d:/projects/devel\\rankrocket/app/node_modules",
        ],
    },

    // "resolveLoader": {
    //     "modules": [

    //         //
    //         "node_modules",
    //         "d:/projects/devel/rankrocket/app\\node_modules",
    //     ],
    // },
};

// eslint-disable-next-line no-unused-vars
const worker = {
    "target": "webworker",
    "devtool": false,

    "output": {
        "path": null,
        "filename": "firebase-messaging-sw.js",
        "publicPath": "",
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
            "#vue": "@softvisio/vue-ext",
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm"],

        // "modules": [

        //     //
        //     "node_modules",
        //     "d:/projects/devel\\rankrocket/app/node_modules",
        // ],
    },

    "plugins": [

        //
        new CaseSensitivePathsPlugin(),
    ],

    "module": {
        "rules": [

            // esm
            // XXX ???
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

// export default [app, worker];
export default [app];
