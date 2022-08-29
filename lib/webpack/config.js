import WebpackConfigEntry from "./config/entry.js";

export default class WebpackConfig {
    #entries = {};

    // public
    get ( name ) {
        return this.#entries[name];
    }

    add ( config ) {
        if ( config instanceof WebpackConfig ) {
            for ( const entry of config ) this.#entries[entry.name] = entry;
        }
        else {
            if ( !( config instanceof WebpackConfigEntry ) ) config = new WebpackConfigEntry( config );

            this.#entries[config.name] = config;
        }

        return this;
    }

    [Symbol.iterator] () {
        return this.#entries.values();
    }
}
