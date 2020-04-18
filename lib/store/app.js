import Store from "@softvisio/vue/lib/store";
import Session from "./session";

export default class extends Store {
    modules () {
        var cfg = super.modules() || {};

        cfg.session = Session;

        return cfg;
    }
}
