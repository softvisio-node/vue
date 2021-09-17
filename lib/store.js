import BaseStore from "@softvisio/vuex";
import SessionStore from "./store/session";
import NotificationsStore from "./store/notifications";

export default class VueStore extends BaseStore {
    static install ( app, options = {} ) {
        if ( !options.store ) options.store = new ( class Store extends this {} )();

        options.store.session ||= SessionStore;
        options.store.notifications ||= NotificationsStore;

        super.install( app, options );
    }
}
