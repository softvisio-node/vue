process.env.VUE_APP_BUILD_CORDOVA = process.env.VUE_APP_BUILD_CORDOVA === "true" ? "true" : "";
process.env.DEVSERVER_POLL = process.env.DEVSERVER_POLL === "true" ? "true" : "";

const vueConfig = {
    "filenameHashing": !process.env.VUE_APP_BUILD_CORDOVA,
    "outputDir": "www",

    "devServer": {
        "host": process.env.DEVSERVER_HOST || "0.0.0.0",
        "port": process.env.DEVSERVER_PORT || "80",
        "allowedHosts": "all",
        "hot": true,
        "compress": false,
        "historyApiFallback": true,
    },

    "transpileDependencies": ["@softvisio"],

    "publicPath": "",

    "pluginOptions": {

        // WebpackBundleAnalyzer, https://github.com/webpack-contrib/webpack-bundle-analyzer#options-for-plugin
        "webpackBundleAnalyzer": {
            "analyzerMode": process.env.NODE_ENV === "production" ? "static" : "server",
            "analyzerPort": process.env.DEVSERVER_ANALYZER_PORT || "8888",
            "openAnalyzer": false,
        },
    },

    // disable lint on development, enable on production
    "lintOnSave": process.env.NODE_ENV === "production" ? "error" : false,

    // NOTE slow
    "productionSourceMap": false,

    "configureWebpack": config => {

        // webpack5 experimental features
        config.experiments ||= {};
        config.experiments.topLevelAwait = true;

        // aliases
        config.resolve.alias["#vue"] = "@softvisio/vue";
    },

    "chainWebpack": config => {
        if ( process.env.NODE_ENV === "development" || process.env.VUE_APP_BUILD_CORDOVA ) {

            // exclude ext from babel-loader
            config.module
                .rule( "js" )
                .exclude.add( /[\\/]resources[\\/]ext-[\d.]+[\\/]/ )
                .end();

            // exclude ewc from babel-loader
            config.module
                .rule( "js" )
                .exclude.add( /[\\/]resources[\\/]ewc-[\d.]+[\\/]/ )
                .end();
        }

        // exclude amcharts4 additional libs from bundle
        config.externals( [
            function ( { context, request }, callback ) {
                if ( /xlsx|canvg|pdfmake/.test( request ) ) {
                    return callback( null, "commonjs " + request );
                }

                callback();
            },
        ] );

        // load *.worker.js via worker-loader
        // config.module
        //     .rule( "worker" )
        //     .test( /\.worker\.js$/ )
        //     .use( "worker-loader" )
        //     .loader( "worker-loader" );

        // disable WebpackBundleAnalyzer
        // if ( process.env.NODE_ENV === "production" || process.env.VUE_APP_BUILD_CORDOVA ) config.plugins.delete( "webpack-bundle-analyzer" );
        config.plugins.delete( "webpack-bundle-analyzer" );
    },
};

module.exports = vueConfig;
