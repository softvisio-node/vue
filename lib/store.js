import BaseStore from "@softvisio/vuex";
import SessionStore from "./store/session";

export default class VueStore extends BaseStore {
    static install ( app, options, store ) {
        if ( !store ) store = new ( class Store extends this {} )();

        store.session ||= SessionStore;

        super.install( app, options, store );
    }
}
