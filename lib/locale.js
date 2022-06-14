import CoreLocale from "#core/locale";

const PARAMETER_NAME = "locale",
    DEFAULT_LOCALE = "en-GB",
    DEFAULT_CURRENCY = "USD",
    LOCALES = {};

if ( process.env.APP_LOCALES ) {
    const locales = process.env.APP_LOCALES.split( /,/ ).map( locale => locale.trim() );

    for ( let locale of locales ) {
        locale = new Intl.Locale( locale );

        LOCALES[locale.baseName] = new Intl.DisplayNames( locale, { "type": "language", "languageDisplay": "standard", "style": "narrow" } ).of( locale.baseName );
    }
}

// add default locale
LOCALES[DEFAULT_LOCALE] ??= new Intl.DisplayNames( DEFAULT_LOCALE, { "type": "language", "languageDisplay": "standard", "style": "narrow" } ).of( DEFAULT_LOCALE );

class Locale extends CoreLocale {
    #hasLocales;

    // properties
    get locales () {
        return LOCALES;
    }

    get hasLocales () {
        this.#hasLocales ??= Object.keys( LOCALES ).length > 1;

        return this.#hasLocales;
    }

    get text () {
        return LOCALES[this.name];
    }

    get defaultCurrency () {
        return process.env.APP_DEFAULT_CURRENCY || DEFAULT_CURRENCY;
    }

    // public
    async add ( locale, domain ) {
        if ( typeof locale === "function" ) {
            try {
                locale = ( await locale( this.language ) ).default;
            }
            catch ( e ) {}
        }

        if ( domain ) {
            this.setDomain( domain, locale );
        }
        else {
            super.add( locale );
        }
    }

    setLocale ( locale ) {
        if ( this.name === locale ) return;

        if ( !LOCALES[locale] ) return false;

        window.localStorage.setItem( PARAMETER_NAME, locale );

        if ( window.location.search ) {
            const url = new URL( window.location.href );

            if ( url.searchParams.has( PARAMETER_NAME ) ) {
                url.searchParams.set( PARAMETER_NAME, locale );

                window.location.href = url;

                return;
            }
        }

        window.location.reload();
    }
}

var localeName = new URLSearchParams( window.location.search ).get( PARAMETER_NAME ) || window.localStorage.getItem( PARAMETER_NAME );

if ( !LOCALES[localeName] ) localeName = process.env.APP_DEFAULT_LOCALE;

if ( !LOCALES[localeName] ) localeName = DEFAULT_LOCALE;

const locale = new Locale( null, { "locale": localeName } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );

await locale.add( language => import( "#resources/locales/" + language + ".po" ), "vue" );
