import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";
import Locales from "#core/locale/locales";

const PARAMETER_NAME = "locale";

class Registry {
    #locale;
    #locales;
    #currency = "USD";
    #localeIsDefined = false;

    constructor () {
        this.#locales = new Locales( config.locales );

        var locale = this.getUrlLocale();
        locale ||= window.localStorage.getItem( PARAMETER_NAME );

        if ( this.hasLocale( locale ) ) {
            this.#locale = locale;
            this.#localeIsDefined = true;
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

    get localeIsDefined () {
        return this.#localeIsDefined;
    }

    get locales () {
        return this.#locales;
    }

    // public
    getUrlLocale () {
        return new URLSearchParams( window.location.search ).get( PARAMETER_NAME );
    }

    hasLocale ( locale ) {
        return this.#locales.hasLocale( locale );
    }

    update ( locales, currency ) {
        this.#locales = new Locales( locales );

        this.#currency = currency;
    }

    canSetLocale ( locale ) {
        if ( this.hasLocale( locale ) ) return true;

        if ( locale === this.#locales.defaultLocale ) return true;

        return false;
    }

    setLocale ( locale ) {
        window.localStorage.setItem( PARAMETER_NAME, locale );
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

    get hasLocales () {
        return registry.locales.hasLocales;
    }

    get locales () {
        return registry.locales;
    }

    get isDefined () {
        return registry.localeIsDefined;
    }

    // public
    async init ( app, { locales, backendLocale } ) {
        if ( this.#initialized ) return;
        this.#initialized = true;

        this.#app = app;

        // set backend data
        registry.update( locales, backendLocale.currency );

        // switch locale
        if ( backendLocale.id !== this.id ) {
            await this.setLocale( backendLocale.id );
        }
        else if ( !this.isDefined ) {
            registry.setLocale( this.id );
        }

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

        if ( !registry.canSetLocale( locale ) ) return result( 400 );

        // set user locale
        if ( this.app?.user.isAuthenticated && this.app.user.locale !== locale ) {
            const res = await this.app.api.call( "account/set-locale", locale );

            if ( !res.ok ) return res;
        }

        registry.setLocale( locale );

        if ( registry.getUrlLocale() ) {
            const url = new URL( window.location.href );
            url.searchParams.delete( PARAMETER_NAME );
            window.location.href = url;
        }
        else {
            this.app.reload();
        }

        return new Promise( resolve => {} );
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
