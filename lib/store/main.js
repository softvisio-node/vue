import Store from "@/store";
import Session from "./session";

export default class extends Store {
    modules () {
        var cfg = super.modules() || {};

        if ( !cfg.session ) cfg.session = Session;

        return cfg;
    }
}
