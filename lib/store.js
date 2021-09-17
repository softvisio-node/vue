import BaseStore from "@softvisio/vuex";
import SessionStore from "./store/session";

export default class VueStore extends BaseStore {
    static install ( app, options = {} ) {
        if ( !options.store ) options.store = new ( class Store extends this {} )();

        options.store.session ||= SessionStore;

        super.install( app, options );
    }
}
