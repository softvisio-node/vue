import Vue from "vue";
import Vuex from "vuex";

Vue.use( Vuex );

export default class Store {
    #initialized;
    #vuex;

    $init ( root ) {
        if ( this.#initialized ) return this;

        this.#initialized = true;

        if ( !root ) root = this;

        var store = this;

        const ctx = {
            "state": {},
            "mutations": {},
            "getters": {},
        };

        do {
            for ( const prop of Object.getOwnPropertyNames( store ) ) {
                if ( prop === "constructor" ) continue; // ignore contructor
                if ( prop.charAt( 0 ) === "_" ) continue; // ignore protected members
                if ( prop.charAt( 0 ) === "$" ) continue; // ignore internal members

                const descriptor = Object.getOwnPropertyDescriptor( store, prop );

                if ( !( "value" in descriptor ) ) continue; // ignore accessors

                if ( typeof descriptor.value === "function" ) {

                    // skip methods
                    if ( descriptor.enumerable === false ) continue;

                    // module class
                    if ( descriptor.value.prototype instanceof Store ) {
                        descriptor.value = new descriptor.value().$init( root );

                        descriptor.value.$root = root;
                        descriptor.value.$parent = this;
                    }
                }

                // skip already processed props
                if ( prop in ctx.state ) continue;

                ctx.state[prop] = descriptor.value;

                ctx.mutations[prop] = function ( state, value ) {
                    state[prop] = value;
                };

                delete store[prop];

                Object.defineProperty( store, prop, {
                    "get": () => {
                        return this.#vuex.state[prop];
                    },
                    "set": value => {
                        this.#vuex.commit( prop, value );
                    },
                    "enumerable": false,
                    "configurable": true,
                } );
            }
        } while ( ( store = Object.getPrototypeOf( store ) ) && Object.getPrototypeOf( store ) );

        this.#vuex = new Vuex.Store( ctx );

        return this;
    }
}
