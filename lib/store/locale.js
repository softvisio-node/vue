import Store from "@softvisio/vuex";
import locale from "#lib/locale";

export default class extends Store {

    // properties
    get name () {
        return locale.name;
    }

    get text () {
        return locale.text;
    }

    get language () {
        return locale.language;
    }

    get region () {
        return locale.region;
    }

    get hasLocales () {
        return locale.hasLocales;
    }

    get locales () {
        return locale.locales;
    }

    // public
    setLocale ( localeName ) {
        return locale.setLocale( localeName );
    }
}
