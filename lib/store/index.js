const MAP = {
    "STATE": "state",
    "GET": "getters",
    "SET": "mutations",
    "ACTION": "actions",
};

const RESERVED = {
    "constructor": true,
    "MODULES": true,
};

const REGEXP = /^(GET|SET|ACTION)_(.+)/;

module.exports = class Store {
    static buildVuexConfig ( store ) {
        const bindTo = store;

        const config = {
            "strict": process.env.NODE_ENV !== "production",
            "state": {},
            "getters": {},
            "mutations": {},
            "actions": {},
            "modules": store.MODULES,
        };

        if ( config.modules ) {
            for ( const module in config.modules ) {
                config.modules[module] = this.buildVuexConfig( new config.modules[module]() );

                config.modules[module].namespaced = true;
            }
        }

        do {
            for ( const prop of Object.getOwnPropertyNames( store ) ) {
                if ( prop.charAt( 0 ) === "_" ) continue; // ignore protected members
                if ( prop.charAt( 0 ) === "$" ) continue; // ignore internal members
                if ( RESERVED[prop] ) continue; // ignore reserved names

                const descriptor = Object.getOwnPropertyDescriptor( store, prop );

                // ignore get / set
                if ( !( "value" in descriptor ) ) continue;

                // method
                if ( typeof descriptor.value === "function" ) {
                    const match = prop.match( REGEXP );

                    if ( !match ) continue;

                    const [type, name] = [match[1], match[2]];

                    if ( name in config[MAP[type]] ) continue;

                    config[MAP[type]][name] = descriptor.value.bind( bindTo );
                }

                // property
                else {
                    // global action
                    if ( prop.substr( 0, 7 ) === "ACTION_" ) {
                        const name = prop.substr( 7 );

                        if ( name in config.actions ) continue;

                        config.actions[name] = descriptor.value;

                        config.actions[name].handler = descriptor.value.handler.bind( bindTo );
                    }

                    // reactive property
                    else {
                        if ( prop in config.state ) continue;

                        config.state[prop] = descriptor.value;
                    }
                }
            }
        } while ( ( store = Object.getPrototypeOf( store ) ) && Object.getPrototypeOf( store ) );

        return config;
    }

    get MODULES () {
        return {};
    }
};
