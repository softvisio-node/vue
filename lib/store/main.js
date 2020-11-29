import Store from "#softvisio/store";
import Session from "./session";

export default class extends Store {
    get MODULES () {
        return {
            "session": Session,
        };
    }
}
