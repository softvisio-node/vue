import { createApp } from "vue";
import Api from "@softvisio/core/api";
import Store from "./store";
import MainStore from "@/store";
import Viewport from "@/viewport.vue";
import * as util from "#softvisio/util";
import EventEmitter from "@softvisio/core/events";

export default function () {
    const app = createApp( Viewport );

    // global event bus
    app.config.globalProperties.$global = new EventEmitter();
    Store.prototype.$global = app.config.globalProperties.$global;

    // util
    app.config.globalProperties.$util = util;
    Store.prototype.$util = app.config.globalProperties.$util;

    // api
    app.config.globalProperties.$api = new Api( process.env.VUE_APP_API_URL, {
        "token": window.localStorage.getItem( "token" ),
    } );
    Store.prototype.$api = app.config.globalProperties.$api;

    // store
    app.config.globalProperties.$store = Store.new( MainStore );

    return app;
}
