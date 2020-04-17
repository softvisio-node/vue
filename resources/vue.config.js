// https://cli.vuejs.org/config/

// const webpack = require( "webpack" );

process.env.VUE_APP_BUILD_CORDOVA = !!+process.env.VUE_APP_BUILD_CORDOVA || process.env.VUE_APP_BUILD_CORDOVA === "true" ? 1 : "";

var config = {
    "filenameHashing": process.env.VUE_APP_BUILD_CORDOVA ? false : true,
    "outputDir": process.env.VUE_APP_BUILD_CORDOVA ? "www" : "dist",

    "devServer": {
        "contentBase": "build",
        "hot": true,
        "historyApiFallback": true,
        "host": "0.0.0.0",
        "port": "80",
        "disableHostCheck": false,
        "compress": false,
        "inline": true,
        "stats": "none",
    },

    "publicPath": "",

    "pluginOptions": {
        // WebpackBundleAnalyzer, https://github.com/webpack-contrib/webpack-bundle-analyzer#options-for-plugin
        "webpackBundleAnalyzer": {
            "openAnalyzer": false,
        },
    },

    // disable lint on development, enable on production
    "lintOnSave": process.env.NODE_ENV === "production" ? "error" : false,

    // NOTE slow
    "productionSourceMap": false,

    "configureWebpack": ( config ) => {
        // aliases
        config.resolve.alias["#ext.js"] = "@softvisio/ext/lib/ext-" + process.env.EXT_VERSION + ".js";
        config.resolve.alias["#ewc.js"] = "@softvisio/ext/lib/ewc-" + process.env.EWC_VERSION + ".js";
        config.resolve.alias["#swc"] = "@softvisio/web-components/lib";

        // global vars
        // config.plugins.push( new webpack.ProvidePlugin( {
        //     "Ext": config.resolve.alias["#ext.js"],
        // } ) );
    },

    "chainWebpack": ( config ) => {
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
            config.plugin( "html" ).tap( ( args ) => {
                args[0].minify.removeAttributeQuotes = false;

                return args;
            } );

            // disable WebpackBundleAnalyzer
            config.plugins.delete( "webpack-bundle-analyzer" );
        }
    },
};

module.exports = config;
