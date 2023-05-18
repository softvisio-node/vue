import VueStore from "#vue/store";

export default class PushNotifications extends VueStore {
    title;
    pushNotificationsEnabled = false;

    // static
    static new () {
        return super.new( "push-notifications" );
    }
}
