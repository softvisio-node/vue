import Vue from "vue";
import Vuex from "vuex";
import store from "@/store";
import session from "./session";

Vue.use( Vuex );

store.modules.session = session;

export default new Vuex.Store( store );
