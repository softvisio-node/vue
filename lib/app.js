import Vue from "vue";
import Api from "@softvisio/core/lib/api";
import store from "./store";
import Viewport from "@/viewport.vue";

Vue.config.productionTip = false;

const api = new Api( {
    "url": process.env.VUE_APP_API_URL,
} );

Vue.prototype.$api = api;

// global event bus
Vue.prototype.$global = new Vue();

// TODO why I shoild do this manually?
Vue.prototype.$store = store;

export default function init () {
    store.dispatch( "session/init" );

    const App = new Vue( {
        store,
        "render": ( h ) => h( Viewport ),
    } ).$mount( "#app" );

    return App;
}
