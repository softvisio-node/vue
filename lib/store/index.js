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
            for ( const name of Object.getOwnPropertyNames( store ) ) {
                if ( name === "constructor" ) continue; // ignore contructor
                if ( name.charAt( 0 ) === "_" ) continue; // ignore protected members
                if ( name.charAt( 0 ) === "$" ) continue; // ignore internal members

                const descriptor = Object.getOwnPropertyDescriptor( store, name );

                // getter
                if ( !( "value" in descriptor ) && !descriptor.writable && descriptor.get ) {

                    // skip already defined getter
                    if ( name in ctx.getters ) continue;

                    // state prop with the same name is already defined
                    if ( name in ctx.state ) throw `State property "${name}" conflicts with the getter`;

                    ctx.getters[name] = descriptor.get.bind( this );

                    descriptor.get = state => this.#vuex.getters[name];

                    Object.defineProperty( store, name, descriptor );

                    continue;
                }

                // function
                if ( typeof descriptor.value === "function" ) {

                    // skip methods
                    if ( !descriptor.enumerable ) continue;

                    // module class
                    if ( descriptor.value.prototype instanceof Store ) {
                        descriptor.value = new descriptor.value().$init( root );

                        descriptor.value.$root = root;
                        descriptor.value.$parent = this;
                    }
                }

                // skip already defined prop
                if ( name in ctx.state ) continue;

                // getter with the same name is already deifned
                if ( name in ctx.getters ) throw `State property "${name}" conflicts with the getter`;

                ctx.state[name] = descriptor.value;

                ctx.mutations[name] = function ( state, value ) {
                    state[name] = value;
                };

                delete store[name];

                Object.defineProperty( store, name, {
                    "get": () => {
                        return this.#vuex.state[name];
                    },
                    "set": value => {
                        this.#vuex.commit( name, value );
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
