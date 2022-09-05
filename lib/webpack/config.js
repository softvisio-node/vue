import { resolve as _resolve } from "#core/utils";

export default class WebpackConfig {
    #schemas = [];
    #context;
    #isCordova;
    #preprocessorDirectives;
    #preprocessorParams;
    #config;

    constructor ( { context, isCordova, preprocessorDirectives, preprocessorParams, config } = {} ) {
        this.#context = context;
        this.#isCordova = isCordova;
        this.#preprocessorDirectives = preprocessorDirectives;
        this.#preprocessorParams = preprocessorParams;
        this.#config = config;
    }

    // properties
    get name () {
        throw `Webpack config name is not defined`;
    }

    get context () {
        return this.#context;
    }

    get isCordova () {
        return this.#isCordova;
    }

    get preprocessorDirectives () {
        return this.#preprocessorDirectives;
    }

    get preprocessorParams () {
        return this.#preprocessorParams;
    }

    get config () {
        return this.#config;
    }

    get schemas () {
        return [...this.#schemas];
    }

    get isEnabled () {
        return true;
    }

    // public
    prepare () {
        this._prepare();
    }

    generate ( options ) {
        const config = this._generate( options );

        // patch name
        config.name = this.name;

        // patch stats
        config.stats = "none";

        // patch output
        config.output.hashFunction ??= "xxhash64";

        return config;
    }

    // protected
    _prepare () {}

    _generate ( options ) {
        return {};
    }

    addSchema ( url, resolve ) {
        if ( resolve ) url = _resolve( url, resolve, { "url": true } );

        this.#schemas.push( url );
    }
}
