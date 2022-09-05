export default class WebpackConfig {
    #schemas = [];
    #context;
    #preprocessor;
    #config;

    constructor ( { context, preprocessor, config } = {} ) {
        this.#context = context;
        this.#preprocessor = preprocessor;
        this.#config = config;
    }

    // properties
    get name () {
        throw `Webpack config name is not defined`;
    }

    get context () {
        return this.#context;
    }

    get preprocessor () {
        return this.#preprocessor;
    }

    get config () {
        return this.#config;
    }

    get schemas () {
        return this.#schemas;
    }

    get isEnabled () {
        return true;
    }

    // public
    prepare () {}

    validate () {}

    generate ( options ) {
        return {};
    }
}
