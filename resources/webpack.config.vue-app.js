import env from "#core/env";
import webpack from "webpack";
import { VueLoaderPlugin } from "vue-loader";
import HTMLPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";
import MiniCSSExtractPlugin from "mini-css-extract-plugin";
import CSSMinimizerPlugin from "css-minimizer-webpack-plugin";
import autoprefixer from "autoprefixer";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const DefinePlugin = webpack.DefinePlugin;

const config = {
    "name": "vue-app",
    "target": "web", // browserslist
    "mode": process.env.WEBPACK_MODE,
    "context": process.env.WEBPACK_CONTEXT,
    "devtool": env.isDevelopment ? "eval" : undefined,
    "experiments": { "topLevelAwait": true },
    "cache": {
        "type": "filesystem",
        "compression": "brotli",
        "maxAge": 1000 * 60 * 60 * 24 * 3, // 3 days
    },

    "entry": {
        "app": "./src/main.js",
    },

    "output": {
        "path": process.env.WEBPACK_OUTPUT_PATH,
        "publicPath": "auto",
        "filename": "js/[name].[contenthash].js",
        "chunkFilename": "js/[name].[contenthash].js",
        "hashDigestLength": 8,
    },

    "resolve": {
        "alias": {
            ...JSON.parse( process.env.WEBPACK_RESOLVE_ALIAS ),
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
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

        "modules": JSON.parse( process.env.WEBPACK_RESOLVE_MODULES ),
    },

    "resolveLoader": { "modules": JSON.parse( process.env.WEBPACK_RESOLVE_LOADER_MODULES ) },

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
                    {
                        "loader": "babel-loader",
                        "options": {
                            "compact": false, // we don't need babel compact, because js files optimized using terser later
                            "presets": [
                                ["@babel/preset-env", { "shippedProposals": true }],
                                ["@vue/app", { "decoratorsLegacy": false, "decoratorsBeforeExport": true }],
                            ],
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
                    {
                        "loader": "vue-style-loader",
                        "options": {
                            "sourceMap": false,
                            "shadowMode": false,
                        },
                    },
                    ...( env.isProduction
                        ? [
                            {
                                "loader": MiniCSSExtractPlugin.loader,
                                "options": {
                                    "esModule": false,
                                },
                            },
                        ]
                        : [] ),
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

    "plugins": [
        new VueLoaderPlugin(),

        new CaseSensitivePathsPlugin(),

        new DefinePlugin( {
            "__VUE_OPTIONS_API__": "true",
            "__VUE_PROD_DEVTOOLS__": "false",
        } ),

        new DefinePlugin( {
            "process.env": process.env.WEBPACK_ENV,
        } ),

        new HTMLPlugin( {
            "title": "rankrocket-ui",
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

// css
if ( env.isProduction ) {
    config.optimization.minimizer.push( new CSSMinimizerPlugin( {
        "parallel": true,
        "minimizerOptions": {
            "preset": [
                "default",
                {
                    "mergeLonghand": false,
                    "cssDeclarationSorter": false,
                    "discardComments": {
                        "removeAll": true,
                    },
                },
            ],
        },
    } ) );

    config.plugins.push( new MiniCSSExtractPlugin( {
        "filename": "css/[name].[contenthash].css",
        "chunkFilename": "css/[name].[contenthash].css",
    } ) );
}

// add bundle analyzer
if ( process.env.WEBPACK_DEV_SERVER || env.isDevelopment ) {
    config.plugins.push( new BundleAnalyzerPlugin( {
        "analyzerMode": process.env.WEBPACK_DEV_SERVER ? "server" : "static",
        "analyzerPort": 8888,
        "openAnalyzer": false,
    } ) );
}

export default config;
