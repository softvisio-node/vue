import Store from "@/store";
import Session from "./session";

export default class extends Store {
    get MODULES () {
        return {
            "session": Session,
            ...super.MODULES,
        };
    }
}
