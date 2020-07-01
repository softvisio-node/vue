import Vue from "vue";
import Vuex from "vuex";
import Api from "@softvisio/core/api/client";
import Store from "#softvisio/store/main";
import Viewport from "@/viewport.vue";
import * as util from "#softvisio/util";

Vue.config.productionTip = false;

// global event bus
var global = ( Vue.prototype.$global = new Vue() );
Vuex.Store.prototype.$global = global;

// util
Vue.prototype.$ = util;
Vuex.Store.prototype.$ = Vue.prototype.$;

// api
Vue.prototype.$api = new Api( process.env.VUE_APP_API_URL, {
    "token": window.localStorage.getItem( "token" ),
    "persistent": true,

    // onOpen () {
    //     global.emit( "api/open" );

    // },

    // onClose ( res ) {
    //     global.emit( "api/close", res );
    // },

    // onEvent ( name, args ) {
    //     global.emit( "server/" + name, ...args );
    // },

    // async onRpc ( method, args ) {},
} );
Vuex.Store.prototype.$api = Vue.prototype.$api;

// store
Vue.use( Vuex );
const store = new Vuex.Store( new Store().getStoreConfig() );
Vue.prototype.$store = store; // TODO why I shoild do this manually?

export default function create ( config ) {
    const App = new Vue( {
        "el": "#app",
        ...config,
        store,
        "render": ( h ) => h( Viewport ),
    } );

    return App;
}
