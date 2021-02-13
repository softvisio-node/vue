import Api from "@softvisio/core/api";

export default {
    install ( app, options ) {
        const api = new Api( process.env.VUE_APP_API_URL, {
            "token": window.localStorage.getItem( "token" ),
        } );

        app.config.globalProperties.$api = api;
    },
};
