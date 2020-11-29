import Store from ".";
import Session from "./session";

export default class extends Store {
    get MODULES () {
        return {
            "session": Session,
        };
    }
}
