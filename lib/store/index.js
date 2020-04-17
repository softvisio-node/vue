import Vue from "vue";
import Vuex from "vuex";

import session from "./session";

Vue.use( Vuex );

var state = {};

var getters = {};

var mutations = {};

var actions = {};

var modules = {
    session,
};

export default new Vuex.Store( {
    state,
    getters,
    mutations,
    actions,
    modules,
} );
