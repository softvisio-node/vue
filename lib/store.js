import BaseStore from "@softvisio/vuex";
import SessionStore from "./session";
import SettingsStore from "./settings";

export default class VueStore extends BaseStore {
    static install ( app, options, store ) {
        if ( !store ) store = new ( class Store extends this {} )();

        store.session ||= SessionStore;
        store.settings ||= SettingsStore;

        super.install( app, options, store );
    }
}
