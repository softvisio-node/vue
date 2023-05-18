import Store from "#vue/store";

export default class Session extends Store {
    title;
    pushNotificationsEnabled = false;

    #app;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // static
    static new ( ...args ) {
        return super.new( "session", ...args );
    }
}
