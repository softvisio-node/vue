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
            window.localStorage.getItem( "locale", locale );

            window.location.reload();
        }
        else {
            this.#locale = locale;

            for ( const l10n of this.#locales ) await l10n.loadLocale( locale );
        }
    }

    async registerLocale ( locale ) {
        this.#locales.push( locale );

        if ( this.locale ) await locale.loadLocale( this.locale );
    }

    i18n ( single, plural, num ) {
        var translation;

        for ( const l10n of this.#locales ) {
            translation = l10n.i18n( single, plural, num );

            if ( translation ) return translation;
        }

        // fallback
        if ( plural && num != null ) {
            return plural.replaceAll( "%s", num );
        }
        else {
            return single;
        }
    }
}

const localizationRegistry = new LocalizationRegistry();

// register globally
window.i18n = localizationRegistry.i18n.bind( localizationRegistry );

// init
const locale = window.localStorage.getItem( "locale" ) || "rus";
await localizationRegistry.setLocale( locale );

export default localizationRegistry;
