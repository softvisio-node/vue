import Store from "@/store";
import Session from "./session";

export default class extends Store {
    constructor () {
        super();

        if ( !this.session ) this.session = Session;
    }
}
