import Vue from "vue";
import Vuex from "vuex";
import Api from "@softvisio/core/api";
import Store from "./store";
import MainStore from "#softvisio/store/main";
import Viewport from "@/viewport.vue";
import * as util from "#softvisio/util";
import EventEmitter from "@softvisio/core/events";

Vue.config.productionTip = false;

// global event bus
Vue.prototype.$global = new EventEmitter();
Store.prototype.$global = Vue.prototype.$global;

// util
Vue.prototype.$ = util;
Store.prototype.$ = Vue.prototype.$;

// api
Vue.prototype.$api = new Api( process.env.VUE_APP_API_URL, {
    "token": window.localStorage.getItem( "token" ),
} );
Store.prototype.$api = Vue.prototype.$api;

// store
Vue.use( Vuex );
Vue.prototype.$store = new Vuex.Store( Store.buildVuexConfig( new MainStore() ) );

export default function create ( config ) {
    const App = new Vue( {
        "el": "#app",
        ...config,
        "render": h => h( Viewport ),
    } );

    return App;
}
