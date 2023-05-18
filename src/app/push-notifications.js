import VueStore from "#vue/store";

export default class PushNotifications extends VueStore {
    title;
    pushNotificationsEnabled = false;

    #app;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // static
    static new () {
        return super.new( "push-notifications" );
    }

    // properties
    get app () {
        return this.#app;
    }
}
