import Locale from "$lib/locale";

class LocalizationRegistry {
    #locale;
    #locales = [];

    // properties
    get locale () {
        return this.#locale;
    }

    // public
    setLocale ( locale ) {
        if ( this.#locale === locale ) return;

        if ( this.#locale ) {
            window.localStorage.setItem( "locale", locale );

            window.location.reload();
        }
        else {
            this.#locale = locale;
        }
    }

    registerLocale ( locale ) {
        this.#locales.push( locale );
    }

    i18n ( msgId, pluralMsgId, num ) {
        for ( const locale of this.#locales ) {
            const translation = locale.translate( msgId, pluralMsgId, num );

            if ( translation ) return translation;
        }

        // fallback to English
        return Locale.translateEnglish( msgId, pluralMsgId, num );
    }
}

const localizationRegistry = new LocalizationRegistry();

// register globally
window.i18n = localizationRegistry.i18n.bind( localizationRegistry );

// init
const locale = new URLSearchParams( window.location.search ).get( "locale" ) || window.localStorage.getItem( "locale" ) || process.env.APP_DEFAULT_LOCALE || "en";
await localizationRegistry.setLocale( locale );

export default localizationRegistry;
