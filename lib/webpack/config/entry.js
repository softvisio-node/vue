import { resolve as _resolve } from "#core/utils";

export default class WebpackConfigEntry {
    #name;
    #generator;
    #schemas = [];
    #wrappers = [];

    constructor ( { name, generator, schemas } = {} ) {
        this.#name = name;
        this.#generator = generator;

        if ( schemas ) {
            if ( !Array.isArray( schemas ) ) schemas = [schemas];

            this.#schemas.push( ...schemas );
        }
    }

    // properties
    get name () {
        return this.#name;
    }

    get schemas () {
        return this.#schemas;
    }

    // public
    generate ( options ) {
        var config = this.#generator( options );

        if ( !config ) return;

        for ( const wrapper of this.#wrappers ) {
            config = wrapper( config, options );

            if ( !config ) return;
        }

        return config;
    }

    wrap ( wrapper ) {
        this.#wrappers.push( wrapper );

        return this;
    }

    addSchema ( url, resolve ) {
        if ( resolve ) url = _resolve( url, resolve );

        this.#schemas.push( url );

        return this;
    }
}
