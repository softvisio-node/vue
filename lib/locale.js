import CoreLocale from "#core/locale";

class Locale extends CoreLocale {

    // public
    async add ( locale ) {
        if ( typeof locale === "function" ) {
            try {
                locale = ( await locale( this.language ) ).default;

                return locale;
            }
            catch ( e ) {}
        }

        super.add( locale );
    }

    setLanguage ( language ) {
        if ( this.language === language ) return;

        window.localStorage.setItem( "locale", language );

        window.location.reload();
    }
}

const locale = new Locale();

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );

// init
const language = new URLSearchParams( window.location.search ).get( "locale" ) || window.localStorage.getItem( "locale" ) || process.env.APP_DEFAULT_LOCALE || "en";

locale.add( { language } );

await locale.add( language => import( "#resources/locales/" + language + ".po" ) );
