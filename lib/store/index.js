import store from "@/store";
import session from "./session";

store.modules.session = session;

if ( !store.actions.applyDarkMode ) store.actions.applyDarkMode = ( darkMode ) => {};

if ( !store.actions.applyTheme ) store.actions.applyTheme = ( theme ) => {};

export default store;
