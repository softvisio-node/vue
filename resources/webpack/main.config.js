import env from "#core/env";
import webpack from "webpack";
import { VueLoaderPlugin } from "vue-loader";
import HtmlPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import PoFile from "#core/locale/po-file";
import { readConfig } from "#core/config";

const DefinePlugin = webpack.DefinePlugin;

const config = {
    "schemas": [new URL( "../schemas/env.main.schema.yaml", import.meta.url )],

    "name": "main",

    // "target": "web", "browserslist",
    "mode": global.WEBPACK.MODE,
    "context": global.WEBPACK.CONTEXT,
    "devtool": env.isDevelopment ? "eval-source-map" : undefined,
    "experiments": { "topLevelAwait": true },
    "cache": global.WEBPACK.CACHE_OPTIONS,

    "entry": {
        "app": "./src",
    },

    "output": {
        "path": global.WEBPACK.OUTPUT_PATH,
        "publicPath": "auto",
        "filename": "js/[name].[contenthash].js",
        "chunkFilename": "js/[name].[contenthash].js",
        "hashDigestLength": 8,
    },

    "resolve": {
        "alias": {
            ...global.WEBPACK.RESOLVE_ALIAS,
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
        },

        // required by froala, can be replaced with crypto-browserify
        "fallback": {
            "crypto": false,
        },

        "extensions": [".mjs", ".js", ".jsx", ".vue", ".json", ".wasm", ".po", ".yaml"],

        "modules": global.WEBPACK.RESOLVE_MODULES,
    },

    "resolveLoader": { "modules": global.WEBPACK.RESOLVE_LOADER_MODULES },

    "optimization": {
        "splitChunks": {
            "cacheGroups": {
                "vendors": {
                    "name": "vendors",
                    "test": /[\\/]node_modules[\\/]/,
                    "priority": -10,
                    "chunks": "initial",
                },
                "common": {
                    "name": "common",
                    "minChunks": 2,
                    "priority": -20,
                    "chunks": "initial",
                    "reuseExistingChunk": true,
                },
            },
        },

        "minimizer": [
            new TerserPlugin( global.WEBPACK.TERSER_OPTIONS ),

            new CssMinimizerPlugin( {
                "parallel": true,
                "minimizerOptions": {
                    "preset": [
                        "default",
                        {
                            "discardComments": {
                                "removeAll": true,
                            },
                        },
                    ],
                },
            } ),
        ],
    },

    "module": {
        "rules": [

            // js
            {
                "test": /\.[cm]?jsx?$/,
                "resolve": {
                    "fullySpecified": false,
                },
                "oneOf": [

                    // web workers *.worker.js
                    {
                        "test": /\.worker\.js$/,
                        "type": "asset/resource",
                        "generator": {
                            "filename": "[name].[hash][ext][query]",
                        },
                    },

                    // other *.js files
                    {
                        "loader": "babel-loader",
                        "options": global.WEBPACK.BABEL_OPTIONS,
                    },
                ],
            },

            // vue
            {
                "test": /\.vue$/,
                "loader": "vue-loader",
                "options": {

                    // XXX "babelParserPlugins": ["jsx", "classProperties", "decorators-legacy"],
                    "compilerOptions": {
                        "isCustomElement": tag => tag.startsWith( "ext-" ),
                    },
                },
            },

            // images
            {
                "test": /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/,
                "type": "asset/resource",
                "generator": {
                    "filename": "img/[name].[hash][ext][query]",
                },
            },

            // media
            {
                "test": /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                "type": "asset/resource",
                "generator": {
                    "filename": "media/[name].[hash][ext][query]",
                },
            },

            // fonts
            {
                "test": /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
                "type": "asset/resource",
                "generator": {
                    "filename": "fonts/[name].[hash][ext][query]",
                },
            },

            // css
            {
                "test": /\.css$/,
                "use": [
                    process.env.WEBPACK_DEV_SERVER
                        ? {
                            "loader": "vue-style-loader",
                            "options": {
                                "sourceMap": false,
                                "shadowMode": false,
                            },
                        }
                        : {
                            "loader": MiniCssExtractPlugin.loader,
                            "options": {
                                "esModule": false,
                            },
                        },
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
                                "plugins": {
                                    "cssnano": {
                                        "preset": ["default", { "normalizeWhitespace": false }],
                                    },
                                },
                            },
                        },
                    },
                ],
            },

            // .po
            {
                "test": /\.po$/,
                "loader": "@softvisio/vue/po-loader",
                "options": { PoFile },
            },

            // .json
            {
                "test": /\.json$/,
                "loader": "@softvisio/vue/config-loader",
                "options": { readConfig, "type": "json" },
            },

            // .yaml
            {
                "test": /\.yaml$/,
                "loader": "@softvisio/vue/config-loader",
                "options": { readConfig, "type": "yaml" },
            },
        ],
    },

    "plugins": [
        new VueLoaderPlugin(),

        new MiniCssExtractPlugin( {
            "filename": "css/[name].[contenthash].css",
            "chunkFilename": "css/[name].[contenthash].css",
        } ),

        new DefinePlugin( {
            "__VUE_OPTIONS_API__": "true",
            "__VUE_PROD_DEVTOOLS__": "false",
            "process.env": global.WEBPACK.ENV,
            "process.config": global.WEBPACK.CONFIG,
        } ),

        new HtmlPlugin( {
            "scriptLoading": "defer",
            "template": "public/index.html",
            "templateParameters": process.env,
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
};

export default config;
