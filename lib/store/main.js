import Store from ".";
import SessionStore from "./session";

export default class extends Store {
    session = SessionStore;
}
