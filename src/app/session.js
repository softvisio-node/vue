import Store from "#vue/store";

export default class Session extends Store {
    title;

    #app;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // static
    static new ( ...args ) {
        return super.new( "session", ...args );
    }

    // properties
    get app () {
        return this.#app;
    }
}
