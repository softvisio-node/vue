import VueStore from "#vue/store";

export default class Session extends VueStore {
    title;
    pushNotificationsEnabled = false;

    // static
    static new () {
        return super.new( "session" );
    }
}
