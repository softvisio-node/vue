import API from "#core/api";

export default {
    install ( app, options ) {
        const api = API.new( process.env.VUE_APP_API_URL, {
            "token": window.localStorage.getItem( "token" ),
        } );

        app.config.globalProperties.$api = api;
    },
};
