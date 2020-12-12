import Vue from "vue";
import Vuex from "vuex";

Vue.use( Vuex );

export default class Store {
    static buildStore ( Super, root ) {
        const Class = class extends Super {};

        const store = new Class();

        store.$init( root );

        return store;
    }

    #initialized;
    #vuex;

    $init ( root ) {
        if ( this.#initialized ) return;

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

                    Object.defineProperty( this, name, descriptor );

                    continue;
                }

                // skip already defined prop
                if ( name in ctx.state ) continue;

                // function
                if ( typeof descriptor.value === "function" ) {

                    // module class
                    if ( descriptor.value.prototype instanceof Store ) {
                        descriptor.value = this.constructor.buildStore( descriptor.value, root );

                        descriptor.value.$root = root;
                        descriptor.value.$parent = this;
                    }

                    // skip methods
                    else {
                        continue;
                    }
                }

                // getter with the same name is already defIned
                if ( name in ctx.getters ) throw `State property "${name}" conflicts with the getter`;

                ctx.state[name] = descriptor.value;

                ctx.mutations[name] = function ( state, value ) {
                    state[name] = value;
                };

                delete this[name];

                Object.defineProperty( this, name, {
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
    }
}
