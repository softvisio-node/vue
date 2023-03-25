import VueStore from "#vue/store";

class Store extends VueStore {
    title;
    pushNotificationsEnabled = false;
}

export default Store.new( "session" );
