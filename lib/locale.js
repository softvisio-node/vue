import CoreLocale from "#core/locale";

const PARAMETER_NAME = "locale",
    DEFAULT_LOCALE = "en-GB",
    DEFAULT_CURRENCY = "USD",
    LOCALES = {};

if ( process.env.APP_LOCALES ) {
    const locales = process.env.APP_LOCALES.split( /,/ ).map( locale => locale.trim() );

    for ( let locale of locales ) {
        locale = new Intl.Locale( locale );

        LOCALES[locale.baseName] = new Intl.DisplayNames( locale, {
            "type": "language",
            "languageDisplay": "standard",
            "style": "short",
        } ).of( locale.baseName );
    }
}

// add default locale
LOCALES[DEFAULT_LOCALE] ??= new Intl.DisplayNames( DEFAULT_LOCALE, { "type": "language", "languageDisplay": "standard", "style": "narrow" } ).of( DEFAULT_LOCALE );

const DEFAULT_APP_LOCALE = process.env.APP_DEFAULT_LOCALE || LOCALES[process.env.APP_DEFAULT_LOCALE] ? process.env.APP_DEFAULT_LOCALE : DEFAULT_LOCALE;

class Locale extends CoreLocale {
    #hasLocales;

    // properties
    get defaultLocale () {
        return DEFAULT_APP_LOCALE;
    }

    get defaultCurrency () {
        return process.env.APP_DEFAULT_CURRENCY || DEFAULT_CURRENCY;
    }

    get hasLocales () {
        this.#hasLocales ??= Object.keys( LOCALES ).length > 1;

        return this.#hasLocales;
    }

    get locales () {
        return LOCALES;
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
        if ( this.id === locale ) return;

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

var localeId = new URLSearchParams( window.location.search ).get( PARAMETER_NAME ) || window.localStorage.getItem( PARAMETER_NAME );

// use default locale
if ( !LOCALES[localeId] ) localeId = DEFAULT_APP_LOCALE;

const locale = new Locale( { "id": localeId } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );

await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ "#resources/locales/" + language + ".po" ), "vue" );
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ "@resources/locales/" + language + ".po" ) );
