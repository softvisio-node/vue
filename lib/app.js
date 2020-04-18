import Vue from "vue";
import Vuex from "vuex";
import Api from "@softvisio/core/lib/api";
import Store from "#softvisio/store";
import Viewport from "@/viewport.vue";
import * as util from "#softvisio/util";

Vue.config.productionTip = false;

// util
Vue.prototype.$ = util;
Vuex.Store.prototype.$ = Vue.prototype.$;

// api
Vue.prototype.$api = new Api( {
    "url": process.env.VUE_APP_API_URL,
} );
Vuex.Store.prototype.$api = Vue.prototype.$api;

// global event bus
Vue.prototype.$global = new Vue();
Vuex.Store.prototype.$global = Vue.prototype.$global;

// store
Vue.use( Vuex );
const store = new Vuex.Store( Store );
Vue.prototype.$store = store; // TODO why I shoild do this manually?

export default function create ( config ) {
    store.dispatch( "session/init" );

    const App = new Vue( {
        "el": "#app",
        ...config,
        store,
        "render": ( h ) => h( Viewport ),
    } );

    return App;
}
