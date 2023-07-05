import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";
import Locales from "#core/locale/locales";

const PARAMETER_NAME = "locale";

class Registry {
    #locale;
    #locales;
    #currency = "USD";
    #isDefined = false;

    constructor () {
        this.#locales = new Locales( config.locales );

        var locale = this.#urlLocale;
        locale ||= window.localStorage.getItem( PARAMETER_NAME );

        if ( locale ) this.#isDefined = true;

        if ( this.hasLocale( locale ) ) {
            this.#locale = locale;
        }
        else {
            this.#locale = this.#locales.defaultLocale;
        }
    }

    // properties
    get locale () {
        return this.#locale;
    }

    get currency () {
        return this.#currency;
    }

    get locales () {
        return this.#locales;
    }

    get isDefined () {
        return this.#isDefined;
    }

    // public
    hasLocale ( locale ) {
        return this.#locales.has( locale );
    }

    update ( locales, currency ) {
        this.#locales = new Locales( this.#locales.merge( locales ) );

        this.#currency = currency;
    }

    async setLocale ( app, locale ) {
        window.localStorage.setItem( PARAMETER_NAME, locale );

        if ( this.#locale === locale ) return;

        this.#locale = locale;

        if ( this.#urlLocale ) {
            const url = new URL( window.location.href );
            url.searchParams.delete( PARAMETER_NAME );
            window.location.href = url;
        }
        else {
            app.reload();
        }

        return new Promise( resolve => {} );
    }

    // private
    get #urlLocale () {
        return new URLSearchParams( window.location.search ).get( PARAMETER_NAME );
    }
}

const registry = new Registry();

class BaseLocale extends CoreLocale {

    // properties
    get currency () {
        return registry.currency;
    }
}

class Locale extends BaseLocale {
    #initialized;
    #app;

    // properties
    get app () {
        return this.#app;
    }

    // XXX
    get canChangeLocale () {
        const locales = new Set( [...registry.locales.locales] );

        if ( this.id === this.locales.defaultLocale ) {
            locales.delete( this.id );
        }

        return locales.size > 1;
    }

    get locales () {
        return registry.locales;
    }

    get isDefined () {
        return registry.isDefined;
    }

    // public
    async init ( app, { locales, backendLocale } ) {
        if ( this.#initialized ) return;
        this.#initialized = true;

        this.#app = app;

        // switch locale
        await registry.setLocale( this.app, backendLocale.id );

        // set backend data
        registry.update( locales, backendLocale.currency );

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

    async setLocale ( locale ) {

        // already set
        if ( this.id === locale ) return result( 2000 );

        if ( !registry.hasLocale( locale ) ) return result( 400 );

        // set user locale
        if ( this.app.user.isAuthenticated && this.app.user.locale !== locale ) {
            const res = await this.app.api.call( "account/set-locale", locale );

            if ( !res.ok ) return res;
        }

        return registry.setLocale( this.app, locale );
    }
}

const locale = new Locale( { "id": registry.locale } );

export default locale;

// register globally
window.i18n = locale.i18n.bind( locale );
window.i18nd = locale.i18nd.bind( locale );
window.i18nt = locale.i18nt.bind( locale );

// add "vue" domain
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `#resources/locales/${language}.po` ), "vue" );

// add app locale
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `@resources/locales/${language}.po` ) );
