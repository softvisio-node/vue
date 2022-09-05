import { resolve as _resolve } from "#core/utils";

export default class WebpackConfig {
    #schemas = [];
    #context;
    #preprocessorParams;
    #config;

    constructor ( { context, preprocessorParams, config } = {} ) {
        this.#context = context;
        this.#preprocessorParams = preprocessorParams;
        this.#config = config;
    }

    // static
    static resolve ( url, resolve ) {
        if ( resolve ) url = _resolve( url, resolve, { "url": true } );

        return url;
    }

    // properties
    get name () {
        throw `Webpack config name is not defined`;
    }

    get context () {
        return this.#context;
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
}
