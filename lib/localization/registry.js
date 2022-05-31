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

    i18n ( strings, ...args ) {
        return this.#translate( strings, args );
    }

    i18p ( strings, ...args ) {
        return this.#translate( strings, args );
    }

    // private
    #translate ( strings, args ) {
        const message = strings.join( "${n}" );

        for ( const locale of this.#locales ) {
            const translation = locale.translate( message, args );

            if ( translation ) return translation;
        }

        // fallback
        return message.replaceAll( "${n}", () => args.shift() || 0 );
    }
}

const localizationRegistry = new LocalizationRegistry();

// register globally
window.i18n = localizationRegistry.i18n.bind( localizationRegistry );
window.i18p = localizationRegistry.i18p.bind( localizationRegistry );

// init
const locale = window.localStorage.getItem( "locale" ) || process.env.APP_DEFAULT_LOCALE || "en";
await localizationRegistry.setLocale( locale );

export default localizationRegistry;
