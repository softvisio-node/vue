import { resolve as _resolve } from "#core/utils";

export default class WebpackConfig {
    #schemas = [];
    #mode;
    #context;
    #isCordova;
    #preprocessorDirectives;
    #preprocessorParams;
    #config;

    constructor ( { mode, context, isCordova, preprocessorDirectives, preprocessorParams, config } = {} ) {
        this.#mode = mode;
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

    get mode () {
        return this.#mode;
    }

    get isDevelopment () {
        return this.mode === "development";
    }

    get isProduction () {
        return !this.isDevelopment;
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

    addSchema ( url, resolve ) {
        if ( resolve ) url = _resolve( url, resolve, { "url": true } );

        this.#schemas.push( url );
    }

    // protected
    _prepare () {}

    _generate ( options ) {
        return {};
    }
}
