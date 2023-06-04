import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";

const PARAMETER_NAME = "locale",
    DEFAULT_LOCALE = new CoreLocale(),
    DEFAULT_CURRENCY = "USD",
    LOCALES = {};

var CURRENCY = DEFAULT_CURRENCY;

if ( config.locales ) {
    for ( let locale of config.locales ) {
        locale = new CoreLocale( locale );

        LOCALES[locale.id] = locale.name;
    }
}

class BaseLocale extends CoreLocale {

    // properties
    get currency () {
        return CURRENCY;
    }
}

class Locale extends BaseLocale {
    #initialized;
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
    async init ( app, { locales, currency, userLocale, backendLocale } ) {
        if ( this.#initialized ) return;

        this.#initialized = true;

        this.#app = app;

        locales = new Set( locales );
        this.#hasLocales = null;

        // delete locales, not supported on backend
        for ( const locale of Object.values( LOCALES ) ) {
            if ( !locales.has( locale.id ) ) delete LOCALES[locale.id];
        }

        // set default currency
        if ( currency ) CURRENCY = currency;

        // switch to the user locale
        this.setLocale( userLocale );

        // add backend domain
        await this.add( backendLocale, "backend" );
    }

    async add ( locale, domain ) {
        if ( !locale ) return;

        if ( typeof locale === "function" ) {
            try {
                locale = ( await locale( this.language ) ).default;
            }
            catch ( e ) {
                return;
            }
        }

        if ( domain ) {
            locale.id = this.id;
            locale = new BaseLocale( locale );

            this.domains.add( domain, locale );
        }
        else {
            super.add( locale );
        }
    }

    async setLocale ( localeId ) {
        if ( this.id === localeId ) return result( 2000 );

        if ( !this.hasLocales ) return result( 400 );

        if ( !LOCALES[localeId] ) return result( 400 );

        // set user locale
        if ( this.app?.user.isAuthenticated && this.app.user.locale !== localeId ) {
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

var localeId = new URLSearchParams( window.location.search ).get( PARAMETER_NAME );
localeId ||= window.localStorage.getItem( PARAMETER_NAME );

// use default locale
if ( !LOCALES[localeId] ) {

    // use config default locale
    if ( config.defaultLocale && LOCALES[config.defaultLocale] ) {
        localeId = config.defaultLocale;
    }

    // use first allowed locale
    else if ( Object.keys( LOCALES ).length === 1 ) {
        localeId = Object.keys( LOCALES )[0];
    }

    // use global default locale
    else {
        localeId = DEFAULT_LOCALE.id;
    }
}

const locale = new Locale( { "id": localeId } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );
window.i18nt = locale.i18nt.bind( locale );

// add "vue" domain
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `#resources/locales/${language}.po` ), "vue" );

// add app locale
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `@resources/locales/${language}.po` ) );
