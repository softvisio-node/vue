export default class {
    #generator;
    #schemas = [];
    #wrappers = [];

    constructor ( generator, schemas ) {
        this.#generator = generator;

        if ( schemas ) {
            if ( !Array.isArray( schemas ) ) schemas = [schemas];

            this.#schemas.push( ...schemas );
        }
    }

    // properties
    get schemas () {
        return this.#schemas;
    }

    // public
    generate ( options ) {
        var config = this.#generator( options );

        for ( const wrapper of this.#wrappers ) config = wrapper( config, options );

        return config;
    }

    wrap ( wrapper ) {
        this.#wrappers.push( wrapper );
    }

    addSchema ( url ) {
        this.#schemas.push( url );
    }
}
