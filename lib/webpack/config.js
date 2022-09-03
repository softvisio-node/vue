import WebpackConfigEntry from "./config/entry.js";

export default class WebpackConfig {
    #entries = new Map();

    // public
    get ( name ) {
        return this.#entries.get( name );
    }

    add ( config ) {
        if ( config instanceof WebpackConfig ) {
            for ( const entry of config ) this.#entries.set( entry.name, entry );
        }
        else {
            if ( !( config instanceof WebpackConfigEntry ) ) config = new WebpackConfigEntry( config );

            this.#entries.set( config.name, config );
        }

        return this;
    }

    delete ( name ) {
        this.#entries.delete( name );
    }

    [Symbol.iterator] () {
        return this.#entries.values();
    }
}
