import CoreLocale from "#core/locale";
import languages from "#core/locale/languages";

const NAME = "locale";

const LOCALES = {};

var HAS_LOCALES = false;

if ( process.env.APP_LOCALES ) {
    const locales = process.env.APP_LOCALES.split( /,/ ).map( locale => locale.trim() );

    for ( const locale of locales ) {
        if ( !LOCALES[locale] ) {
            const [language, country] = locale.split( "-" );

            if ( !languages[language] ) continue;

            LOCALES[locale] = {
                "id": locale,
                "name": `${languages[language].name}${country ? ` (${country.toUpperCase()})` : ""}`,
            };

            if ( locale !== "en" ) HAS_LOCALES = true;
        }
    }
}

if ( !LOCALES.en ) {
    LOCALES.en = {
        "id": "en",
        "name": languages.en.name,
    };
}

class Locale extends CoreLocale {

    // properties
    get locales () {
        return LOCALES;
    }

    get hasLocales () {
        return HAS_LOCALES;
    }

    get name () {
        return LOCALES[this.name].name;
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

        window.localStorage.setItem( NAME, locale );

        if ( window.location.search ) {
            const url = new URL( window.location.href );

            if ( url.searchParams.has( NAME ) ) {
                url.searchParams.set( NAME, locale );

                window.location.href = url;

                return;
            }
        }

        window.location.reload();
    }
}

var _locale = new URLSearchParams( window.location.search ).get( NAME ) || window.localStorage.getItem( NAME );

if ( !LOCALES[_locale] ) _locale = process.env.APP_DEFAULT_LOCALE;

if ( !LOCALES[_locale] ) _locale = "en";

const locale = new Locale( null, { "locale": _locale } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );

await locale.add( language => import( "#resources/locales/" + language + ".po" ), "vue" );
