import Vue from "vue";
import Vuex from "vuex";
import Api from "@softvisio/core/lib/api";
import Store from "#softvisio/store";
import Viewport from "@/viewport.vue";

Vue.config.productionTip = false;

const api = new Api( {
    "url": process.env.VUE_APP_API_URL,
} );

Vue.prototype.$api = api;
Vuex.Store.prototype.$api = api;

// global event bus
Vue.prototype.$global = new Vue();

Vue.use( Vuex );
const store = new Vuex.Store( Store );
// TODO why I shoild do this manually?
Vue.prototype.$store = Store;

export default function init () {
    store.dispatch( "session/init" );

    const App = new Vue( {
        store,
        "render": ( h ) => h( Viewport ),
    } ).$mount( "#app" );

    return App;
}
