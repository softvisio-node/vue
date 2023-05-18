import Store from "#vue/store";

export default class Session extends Store {
    title;
    pushNotificationsEnabled = false;

    // static
    static new ( ...args ) {
        return super.new( "session", ...args );
    }
}
