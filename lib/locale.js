import CoreLocale from "#core/locale";
import locales from "#core/locale/locales";

class Locale extends CoreLocale {
    #locales;

    constructor () {
        const _locales = {};

        if ( process.env.APP_LOCALES ) {
            const languages = process.env.APP_LOCALES.split( /,/ ).map( locale => locale.trim() );

            for ( const language of languages ) {
                if ( locales[language] ) _locales[language] = locales[language];
            }

            if ( !_locales.en ) _locales.en = locales.en;
        }

        var language = new URLSearchParams( window.location.search ).get( "locale" ) || window.localStorage.getItem( "locale" ) || process.env.APP_DEFAULT_LOCALE || "en";

        if ( !_locales[language] ) language = "en";

        super( { language } );

        this.#locales = _locales;
    }

    // properties
    get locales () {
        return this.#locales;
    }

    // public
    async add ( locale ) {
        if ( typeof locale === "function" ) {
            try {
                locale = ( await locale( this.language ) ).default;
            }
            catch ( e ) {}
        }

        super.add( locale );
    }

    setLanguage ( language ) {
        if ( this.language === language ) return;

        if ( !this.#locales[language] ) return false;

        window.localStorage.setItem( "locale", language );

        window.location.reload();
    }
}

const locale = new Locale();

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );

await locale.add( language => import( "#resources/locales/" + language + ".po" ) );
