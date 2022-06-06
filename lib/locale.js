import CoreLocale from "#core/locale";
import locales from "#core/locale/locales";

const NAME = "locale";

const LOCALES = {};

var HAS_LOCALES = false;

if ( process.env.APP_LOCALES ) {
    const languages = process.env.APP_LOCALES.split( /,/ ).map( locale => locale.trim() );

    for ( const language of languages ) {
        if ( !locales[language] ) continue;

        if ( !LOCALES[language] ) {
            LOCALES[language] = locales[language];

            if ( language !== "en" ) HAS_LOCALES = true;
        }
    }
}

if ( !LOCALES.en ) LOCALES.en = locales.en;

class Locale extends CoreLocale {

    // properties
    get locales () {
        return LOCALES;
    }

    get hasLocales () {
        return HAS_LOCALES;
    }

    get locale () {
        return LOCALES[this.language];
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
            this.addDomain( domain.locale );
        }
        else {
            super.add( locale );
        }
    }

    setLanguage ( language ) {
        if ( this.language === language ) return;

        if ( !LOCALES[language] ) return false;

        window.localStorage.setItem( NAME, language );

        if ( window.location.search ) {
            const url = new URL( window.location.href );

            if ( url.searchParams.has( NAME ) ) {
                url.searchParams.set( NAME, language );

                window.location.href = url;

                return;
            }
        }

        window.location.reload();
    }
}

var language = new URLSearchParams( window.location.search ).get( NAME ) || window.localStorage.getItem( NAME ) || process.env.APP_DEFAULT_LOCALE || "en";

if ( !LOCALES[language] ) language = "en";

const locale = new Locale( { language } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );

await locale.add( language => import( "#resources/locales/" + language + ".po" ), "vue" );
