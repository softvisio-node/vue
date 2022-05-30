class LocalizationRegistry {
    #locale;
    #locales = [];

    // properties
    get locale () {
        return this.#locale;
    }

    // public
    async setLocale ( locale ) {
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

    i18n ( message, num ) {
        for ( const l10n of this.#locales ) {
            const translation = l10n.i18nNull( message, num );

            if ( translation ) return translation;
        }

        // fallback
        return message.replaceAll( "%d", num || 0 );
    }
}

const localizationRegistry = new LocalizationRegistry();

// register globally
window.i18n = localizationRegistry.i18n.bind( localizationRegistry );

// init
const locale = window.localStorage.getItem( "locale" ) || "rus";
await localizationRegistry.setLocale( locale );

export default localizationRegistry;
