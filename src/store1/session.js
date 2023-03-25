import VueStore from "#vue/store1";

class Store extends VueStore {
    title;
    pushNotificationsEnabled = false;
}

export default Store.new( "session" );
