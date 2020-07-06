// https://cli.vuejs.org/config/

// import webpack from "webpack.js";

process.env.VUE_APP_BUILD_CORDOVA = !!+process.env.VUE_APP_BUILD_CORDOVA || process.env.VUE_APP_BUILD_CORDOVA === "true" ? 1 : "";

var config = {
    "filenameHashing": process.env.VUE_APP_BUILD_CORDOVA ? false : true,
    "outputDir": "www",

    "devServer": {
        "contentBase": "build",
        "hot": true,
        "historyApiFallback": true,
        "host": process.env.DEVSERVER_HOST || "0.0.0.0",
        "port": process.env.DEVSERVER_PORT || "80",
        "disableHostCheck": false,
        "compress": false,
        "inline": true,
        "stats": "none",
        "watchOptions": {
            "poll": !process.env.DEVSERVER_POLL ? false : process.env.DEVSERVER_POLL === "true" ? true : +process.env.DEVSERVER_POLL,
        },
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

        // aliases
        config.resolve.alias["#softvisio"] = "@softvisio/vue/lib";

        // TODO remove after webpack5 will support "extends" option
        config.resolve.alias["@softvisio/core"] = "@softvisio/core/lib";
        config.resolve.alias["@softvisio/vue"] = "@softvisio/vue/lib";

        // global vars
        // config.plugins.push( new webpack.ProvidePlugin( {
        //     "Ext": config.resolve.alias["#ext.js"],
        // } ) );
    },

    "chainWebpack": config => {

        // clear exclude for "babel-loader"
        // config.module
        //     .rule( "js" )
        //     .exclude.clear()
        //     .end();

        if ( process.env.NODE_ENV === "development" || process.env.VUE_APP_BUILD_CORDOVA ) {

            // exclude ext from babel-loader
            config.module
                .rule( "js" )
                .exclude.add( /[\\/]resources[\\/]ext-v[\d.]+[\\/]/ )
                .end();

            // exclude ewc from babel-loader
            config.module
                .rule( "js" )
                .exclude.add( /[\\/]resources[\\/]ewc-v[\d.]+[\\/]/ )
                .end();
        }

        // exclude amcharts4 additional libs from bundle
        config.externals( [
            function ( context, request, callback ) {
                if ( /xlsx|canvg|pdfmake/.test( request ) ) {
                    return callback( null, "commonjs " + request );
                }

                callback();
            },
        ] );

        // load *.worker.js via worker-loader
        config.module
            .rule( "worker" )
            .test( /\.worker\.js$/ )
            .use( "worker-loader" )
            .loader( "worker-loader" );

        if ( process.env.NODE_ENV === "production" ) {

            // configure html minification, https://github.com/kangax/html-minifier#options-quick-reference
            config.plugin( "html" ).tap( args => {
                args[0].minify.removeAttributeQuotes = false;

                return args;
            } );
        }

        // disable WebpackBundleAnalyzer
        if ( process.env.NODE_ENV === "production" || process.env.VUE_APP_BUILD_CORDOVA ) config.plugins.delete( "webpack-bundle-analyzer" );
    },
};

module.exports = config;
