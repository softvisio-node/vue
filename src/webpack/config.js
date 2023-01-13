import { resolve as _resolve } from "#core/utils";

export default class WebpackConfig {
    #schemas = [];
    #mode;
    #context;
    #isDevServer;
    #isCordova;
    #buildOptions;
    #appConfig;
    #preprocessorDirectives;
    #preprocessorParams;

    constructor ( { mode, context, isDevServer, isCordova, buildOptions, appConfig, preprocessorDirectives, preprocessorParams } = {} ) {
        this.#mode = mode;
        this.#context = context;
        this.#isDevServer = isDevServer;
        this.#isCordova = isCordova;
        this.#buildOptions = buildOptions;
        this.#appConfig = appConfig;
        this.#preprocessorDirectives = preprocessorDirectives;
        this.#preprocessorParams = preprocessorParams;
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

    get isDevServer () {
        return this.#isDevServer;
    }

    get isCordova () {
        return this.#isCordova;
    }

    get buildOptions () {
        return this.#buildOptions;
    }

    get appConfig () {
        return this.#appConfig;
    }

    get preprocessorDirectives () {
        return this.#preprocessorDirectives;
    }

    get preprocessorParams () {
        return this.#preprocessorParams;
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
