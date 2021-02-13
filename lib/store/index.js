import BaseStore from "@softvisio/vuex";
import SessionStore from "./session";
import SettingsStore from "./settings";

export default class Store extends BaseStore {
    static install ( app, options, store ) {
        if ( !store ) {
            const Class = class extends this {
                $root = this;
                $parent = this;
            };

            store = new Class( options );
        }

        store.session ||= SessionStore;
        store.settings ||= SettingsStore;

        super.install( app, options, store );
    }
}
