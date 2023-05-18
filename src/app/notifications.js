import Store from "#vue/store";

export default class VueNotifications extends Store {
    pushNotificationsEnabled = false;

    #app;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // static
    static new ( ...args ) {
        return super.new( "notifications", ...args );
    }

    // properties
    get app () {
        return this.#app;
    }
}
