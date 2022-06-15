import Store from "@softvisio/vuex";
import LocaleStore from "#lib/store/locale";
import SessionStore from "#lib/store/session";

var INSTALLED;

export default class VueStore extends Store {
    static install ( app, options = {} ) {
        if ( INSTALLED ) throw `Store is already installed`;

        INSTALLED = true;

        const globalProperties = app.config.globalProperties;

        Object.defineProperties( Store.prototype, {
            "$app": {
                get () {
                    return globalProperties.$app;
                },
            },
            "$api": {
                get () {
                    return globalProperties.$api;
                },
            },
            "$store": {
                get () {
                    return globalProperties.$store;
                },
            },
            "$utils": {
                get () {
                    return globalProperties.$utils;
                },
            },
        } );

        const store = this.new();

        store.initMainStore();

        app.config.globalProperties.$store = store;
    }

    initMainStore () {
        this.locale ||= LocaleStore.new();
        this.session ||= SessionStore.new();
    }
}
