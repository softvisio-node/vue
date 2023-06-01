import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";

const PARAMETER_NAME = "locale",
    DEFAULT_LOCALE = new CoreLocale(),
    DEFAULT_CURRENCY = "USD",
    LOCALES = {};

if ( config.locales ) {
    for ( let locale of config.locales ) {
        locale = new CoreLocale( locale );

        LOCALES[locale.id] = locale.name;
    }
}

class Locale extends CoreLocale {
    #app;
    #hasLocales;

    // properties
    get app () {
        return this.#app;
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
            locale.id = this.id;
            locale.currency = this.currency;

            this.domains.add( domain, locale );
        }
        else {
            super.add( locale );
        }
    }

    setApp ( app ) {
        this.#app = app;
    }

    async setLocale ( localeId ) {
        if ( this.id === localeId ) return result( 2000 );

        if ( !LOCALES[localeId] ) return result( 400 );

        // set user locale
        if ( this.app.user.isAuthenticated && this.app.user.locale !== localeId ) {
            const res = await this.app.api.call( "account/set-locale", localeId );

            if ( !res.ok ) return res;
        }

        window.localStorage.setItem( PARAMETER_NAME, localeId );

        if ( window.location.search ) {
            const url = new URL( window.location.href );

            if ( url.searchParams.has( PARAMETER_NAME ) ) {
                url.searchParams.set( PARAMETER_NAME, localeId );

                window.location.href = url;
            }
        }

        this.app.reload();

        return result( 200 );
    }
}

var localeId = new URLSearchParams( window.location.search ).get( PARAMETER_NAME ) || window.localStorage.getItem( PARAMETER_NAME );

// use default locale
if ( !LOCALES[localeId] ) {
    if ( config.defaultLocale && LOCALES[config.defaultLocale] ) {
        localeId = config.defaultLocale;
    }
    else if ( Object.keys( LOCALES ).length === 1 ) {
        localeId = Object.keys( LOCALES )[0];
    }
    else {
        localeId = DEFAULT_LOCALE.id;
    }
}

const locale = new Locale( { "id": localeId, "currency": config.defaultCurrency || DEFAULT_CURRENCY } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );

await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ "#resources/locales/" + language + ".po" ), "vue" );
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ "@resources/locales/" + language + ".po" ) );
