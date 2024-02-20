import result from "#core/result";
import CoreLocale from "#core/locale";
import config from "#vue/config";
import Locales from "#core/locale/locales";

const PARAMETER_NAME = "locale";

class Registry {
    #locale;
    #locales;
    #currency = "USD";
    #forceLocale = false;
    #isDefined = false;

    constructor () {
        this.#locales = new Locales( config.locales, {
            "defaultLocale": config.defaultLocale,
        } );

        // get locale from url parameter
        this.#locale = this.#urlLocale;

        if ( this.hasLocale( this.#locale ) ) {
            this.#forceLocale = true;
        }
        else {

            // get locale from storage
            this.#locale = window.localStorage.getItem( PARAMETER_NAME );

            if ( !this.hasLocale( this.#locale ) ) this.#locale = null;
        }

        if ( this.#locale ) {
            this.#isDefined = true;
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

    get forceLocale () {
        return this.#forceLocale;
    }

    get isDefined () {
        return this.#isDefined;
    }

    get canChangeLocale () {
        return this.#locales.canChangeLocale( this.#locale );
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

    get canChangeLocale () {
        return registry.canChangeLocale;
    }

    get locales () {
        return registry.locales;
    }

    get forceLocale () {
        return registry.forceLocale;
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
    }

    async add ( locale ) {
        if ( !locale ) return;

        if ( typeof locale === "function" ) {
            try {
                locale = ( await locale( this.language ) ).default;
            }
            catch ( e ) {
                return;
            }
        }

        super.add( locale );
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
window.l10n = locale.l10n.bind( locale );
window.l10nt = locale.l10nt.bind( locale );

// add "vue" translations
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `#resources/locales/${ language }.po` ) );

// add app locale
await locale.add( language => import( /* webpackChunkName: "locales/[request]" */ `@resources/locales/${ language }.po` ) );
