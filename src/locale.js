import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";

const PARAMETER_NAME = "locale";

class Registry {
    #locale;
    #locales = new Map();
    #currency = "USD";
    #defaultLocale = new CoreLocale().id;
    #localeIsSet = false;

    constructor () {
        if ( config.locales ) {
            for ( let locale of config.locales ) {
                locale = new CoreLocale( locale );

                this.#locales.set( locale.id, locale.name );
            }

            var locale = this.getUrlLocale();
            locale ||= window.localStorage.getItem( PARAMETER_NAME );

            if ( this.hasLocale( locale ) ) {
                this.#locale = locale;
                this.#localeIsSet = true;
            }
            else {
                this.#locale = this.#defaultLocale;
            }
        }
    }

    // properties
    get locale () {
        return this.#locale;
    }

    hasLocales () {
        return this.#locales > 1;
    }

    get locales () {
        return this.#locales;
    }

    get currency () {
        return this.#currency;
    }

    set currency ( value ) {
        if ( value ) this.#currency = value;
    }

    get localeIsSet () {
        return this.#localeIsSet;
    }

    // public
    getUrlLocale () {
        return new URLSearchParams( window.location.search ).get( PARAMETER_NAME );
    }

    hasLocale ( locale ) {
        return this.#locales.has( locale );
    }

    setBackendLocales ( locales ) {
        locales = new Set( locales );

        for ( const locale of this.locales.keys() ) {
            if ( !locales.has( locale ) ) {
                this.locales.delete( locale );
            }
        }
    }

    canSetLocale ( locale ) {
        if ( this.hasLocale( locale ) ) return true;

        if ( locale === this.#defaultLocale ) return true;

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
        return registry.hasLocales;
    }

    get locales () {
        return [...registry.locales.entries()].map( ( [id, name] ) => {
            return { id, name };
        } );
    }

    get isSet () {
        return registry.localeIsSet;
    }

    // public
    async init ( app, { locales, backendLocale } ) {
        if ( this.#initialized ) return;
        this.#initialized = true;

        this.#app = app;

        // delete locales, not supported on backend
        registry.setBackendLocales( locales );

        // set default currency
        registry.currency = backendLocale.currency;

        // switch locale
        if ( backendLocale.id !== this.id ) {
            await this.setLocale( backendLocale.id );
        }
        else if ( !this.isSet ) {
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

        return result( 200 );
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
