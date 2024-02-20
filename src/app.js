import locale from "#vue/locale";
import Events from "#core/events";
import Mutex from "#core/threads/mutex";
import * as utils from "#vue/utils";
import config from "#vue/config";
import Api from "#core/api";
import uuid from "#core/uuid";
import result from "#core/result";
import Viewport from "#vue/app/viewport";
import Settings from "#vue/app/settings";
import Theme from "#src/app/theme";
import Notifications from "#vue/app/notifications";
import User from "#src/app/user";

const API_TOKEN_KEY = "apiToken";

export default class VueApp extends Events {
    #initialized;
    #deviceReady = false;
    #theme;
    #notifications;
    #api;
    #viewport;
    #user;
    #settings = new Settings( this );
    #authorizationMutex = new Mutex();
    #accessDeniedMutex = new Mutex();
    #oauthWindow;
    #signingOut;

    // static
    static async new () {
        const app = new this();

        await app.init();

        return app;
    }

    // properties
    get isCordova () {
        return !!window.cordova;
    }

    get isDeviceReady () {
        return this.#deviceReady;
    }

    get utils () {
        return utils;
    }

    get config () {
        return config;
    }

    get locale () {
        return locale;
    }

    get viewport () {
        return this.#viewport;
    }

    get theme () {
        return this.#theme;
    }

    get notifications () {
        return this.#notifications;
    }

    get api () {
        return this.#api;
    }

    get user () {
        return this.#user;
    }

    get settings () {
        return this.#settings;
    }

    // public
    async init () {
        if ( this.#initialized ) throw Error( `App is already initialized` );

        this.#initialized = true;

        // theme
        this.#theme = new Theme( this );

        // notifications
        this.#notifications = new Notifications( this );

        // create viewport
        this.#viewport = new Viewport( this );
        await this.#viewport.init();

        // wait for device ready under cordova
        if ( this.isCordova ) {
            await new Promise( resolve =>
                document.addEventListener( "deviceready", resolve, {
                    "once": true,
                    "capture": true,
                } ) );
        }

        this._onDeviceReady();

        // init api
        if ( config.apiUrl ) {
            this.#api = Api.new( config.apiUrl, {
                "locale": locale.id,
                "token": window.localStorage.getItem( API_TOKEN_KEY ),
                "onAuthorization": this.#onAuthorization.bind( this ),
            } );
        }

        this.#settings.setTitle( config.title );
    }

    mount ( selector ) {
        this.#viewport.mount( selector );
    }

    async reload () {
        window.location.reload();

        return new Promise( resolve => {} );
    }

    async initSession () {
        while ( true ) {
            const res = await this.#api.call( "session/init-session", {
                "locale": this.locale.isDefined ? this.locale.id : null,
                "locales": this.locale.locales,
                "defaultLocale": this.locale.locales.defaultLocale,
                "forceLocale": this.locale.forceLocale,
                "detectLocaleByClientIpAddress": this.config.detectLocaleByClientIpAddress,
            } );

            // context is disabled or deleted
            if ( res.status === -32813 || res.status === -32815 ) {
                await this.#signOut( { res, "showAlert": false } );
            }

            // connected
            else if ( res.ok ) {
                this.#settings.setBackendSettings( res.data.settings );

                this.#user = new User( this, res.data.user, res.data.permissions );

                // update locale
                await this.locale.init( this, {
                    "locales": this.#settings.locales,
                    "backendLocale": res.data.locale,
                } );

                break;
            }

            // connection error
            else {
                await this._onConnectionError( res );
            }
        }

        this.#api.on( "sessionDisable", this.#signOut.bind( this, { "showAlert": true } ) );
        this.#api.on( "sessionDelete", this.#signOut.bind( this, { "showAlert": true } ) );
        this.#api.on( "sessionReload", this.reload.bind( this ) );
        this.#api.on( "accessDenied", this.#onAccessDenied.bind( this ) );

        if ( this.#user.isAuthenticated ) {
            this.#api.on( "connect", () => this.#api.call( "session/check-authentication" ) );
        }

        this.#notifications.init();
    }

    async authorize ( options, { emailHint = true, doAuthorization = true } = {} ) {

        // oauth
        if ( options.oauthProvider ) {
            const res = await this.#oauth( options.oauthProvider, emailHint ? this.user.email : null );

            if ( !res.ok ) return res;

            options = res.data;
        }

        if ( !doAuthorization ) {
            return result( 200, options );
        }
        else {
            return this.#api.call( "session/authorize", options );
        }
    }

    async signIn ( credentials ) {

        // oauth
        if ( credentials.oauthProvider ) {
            const res = await this.#oauth( credentials.oauthProvider );

            if ( !res.ok ) return res;

            credentials = res.data;
        }

        const res = await this.#api.call( "session/sign-in", credentials );

        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#notifications.disablePushNotifications( false );

            // store api token
            window.localStorage.setItem( API_TOKEN_KEY, res.data.token );

            // reload
            this.reload();
        }

        return res;
    }

    async signOut () {
        this.#signOut( { "doSignout": true } );
    }

    async signUp ( email, fields ) {

        // oauth
        if ( email.oauthProvider ) {
            const res = await this.#oauth( email.oauthProvider );

            if ( !res.ok ) return res;

            email = res.data;
        }

        fields = { "locale": this.locale.id, ...fields };

        const res = await this.#api.call( "session/sign-up", email, fields );

        // signed up and signed in
        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#notifications.disablePushNotifications( false );

            // store api token
            window.localStorage.setItem( API_TOKEN_KEY, res.data.token );

            // reload
            this.reload();
        }

        return res;
    }

    getBadgeNumber () {
        return window.FirebasePlugin?.getBadgeNumber();
    }

    setBadgeNumber ( number ) {
        window.FirebasePlugin?.setBadgeNumber( number || 0 );
    }

    clearBadgeNumber () {
        window.FirebasePlugin?.setBadgeNumber( 0 );
    }

    clearAllNotifications () {
        window.FirebasePlugin?.clearAllNotifications();
    }

    mask () {
        this.#viewport?.mask();
    }

    unmask () {
        this.#viewport?.unmask();
    }

    // protected
    _onDeviceReady () {
        this.#deviceReady = true;

        window.onbeforeunload = this._onDeviceUnload.bind( this );

        // register cordova events, https://cordova.apache.org/docs/en/latest/cordova/events/events.html
        if ( this.isCordova ) {
            document.addEventListener( "pause", e => this.emit( "device/pause" ) );
            document.addEventListener( "resume", e => this.emit( "device/resume" ) );
            document.addEventListener( "backbutton", e => this.emit( "device/back-button" ) );
            document.addEventListener( "menubutton", e => this.emit( "device/menu-button" ) );
            document.addEventListener( "searchbutton", e => this.emit( "device/search-button" ) );
            document.addEventListener( "startcallbutton", e => this.emit( "device/start-call-button" ) );
            document.addEventListener( "endcallbutton", e => this.emit( "device/end-call-button" ) );
            document.addEventListener( "volumedownbutton", e => this.emit( "device/volume-down-button" ) );
            document.addEventListener( "volumeupbutton", e => this.emit( "device/volume-up-button" ) );
            document.addEventListener( "activated", e => this.emit( "device/activated" ) );

            document.addEventListener( "online", e => this.emit( "device/online" ) );
            document.addEventListener( "offline", e => this.emit( "device/offline" ) );
        }
    }

    async _onConnectionError ( res ) {
        if ( res ) this.utils.toast( res );

        return this.utils.alert( l10n( `Unable to connect to the API server. Check, that you have internet connection.` ), {
            "title": l10n( `Connection error` ),
        } );
    }

    async _onSignout ( res ) {
        if ( res ) this.utils.toast( res );

        await this.utils.alert( l10n( `Your session was terminated on the API server.` ), {
            "title": l10n( `Session closed` ),
        } );

        this.mask();
    }

    // NOTE return true to prevent app unload, e.returnValue = true;
    _onDeviceUnload ( e ) {}

    _onAuthorization () {
        return false;
    }

    async _onAccessDenied () {}

    // private
    async #oauth ( oauthProvider, emailHint ) {

        // close pending oauth
        if ( this.#oauthWindow ) {
            if ( !this.#oauthWindow.closed ) this.#oauthWindow.close();

            this.#oauthWindow = null;
        }

        const oauthUrl = new URL( window.location.href );
        oauthUrl.pathname = "/api/oauth.html";
        oauthUrl.search = "";
        oauthUrl.hash = "";

        const state = uuid();

        var providerUrl;

        // google, https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient
        if ( oauthProvider === "google" ) {
            providerUrl = new URL( "https://accounts.google.com/o/oauth2/auth" );

            providerUrl.searchParams.set( "state", state );
            providerUrl.searchParams.set( "client_id", this.settings.oauthGoogleClientId );
            providerUrl.searchParams.set( "redirect_uri", oauthUrl.href );

            if ( emailHint ) providerUrl.searchParams.set( "login_hint", emailHint );

            providerUrl.searchParams.set( "response_type", "code" );

            providerUrl.searchParams.set(
                "scope",
                [

                    //
                    "https://www.googleapis.com/auth/userinfo.email", // access email
                    "https://www.googleapis.com/auth/userinfo.profile", // access profile
                ].join( " " )
            );
        }

        // github, https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
        else if ( oauthProvider === "github" ) {
            providerUrl = new URL( "https://github.com/login/oauth/authorize" );

            providerUrl.searchParams.set( "state", state );
            providerUrl.searchParams.set( "client_id", this.settings.oauthGithubClientId );
            providerUrl.searchParams.set( "redirect_uri", oauthUrl.href );

            // NOTE github displays useless permissions request
            // if ( emailHint ) providerUrl.searchParams.set( "login", emailHint );

            providerUrl.searchParams.set(
                "scope",
                [

                    //
                    "user:email", // access email
                ].join( " " )
            );
        }

        if ( !providerUrl ) return result( [ 400, l10n( `Authorization provider is not supported` ) ] );

        const oauthWindow = ( this.#oauthWindow = window.open( oauthUrl, null, "toolbar=no, menubar=no, width=600, height=700" ) );
        oauthWindow.focus();

        const params = await new Promise( resolve => {
            const interval = setInterval( () => {
                if ( !oauthWindow.closed ) return;

                clearInterval( interval );

                resolve( false );
            }, 300 );

            window.addEventListener( "message", e => {
                if ( e.source !== oauthWindow ) return;

                if ( e.data?.action === "begin" ) {
                    oauthWindow.postMessage( { "providerUrl": providerUrl.href } );
                }
                else if ( e.data?.action === "end" ) {
                    clearInterval( interval );

                    oauthWindow.close();

                    resolve( e.data?.params ? new URLSearchParams( e.data.params ) : false );
                }
                else {
                    clearInterval( interval );

                    oauthWindow.close();

                    resolve( false );
                }
            } );
        } );

        if ( !params ) return result( [ 400, l10n( "Authorization cancelled" ) ] );

        if ( !params.get( "code" ) ) return result( [ 400, l10n( "Authorization cancelled" ) ] );

        if ( params.get( "state" ) !== state ) return result( [ 400, l10n( "Authorization cancelled" ) ] );

        return result( 200, {
            "oauth_provider": oauthProvider,
            "oauth_code": params.get( "code" ),
            "oauth_redirect_uri": oauthUrl.href,
        } );
    }

    async #signOut ( { res, showAlert, doSignout } = {} ) {
        if ( this.#signingOut ) return;

        this.#signingOut = true;

        if ( showAlert ) await this._onSignout( res );

        // disable push notifications
        await this.#notifications.disablePushNotifications( false );

        // sign out
        if ( doSignout ) await this.#api.call( "session/sign-out" );

        // drop api token
        window.localStorage.removeItem( API_TOKEN_KEY );

        // reload
        this.reload();
    }

    async #onAuthorization () {
        if ( !this.#authorizationMutex.tryLock() ) return this.#authorizationMutex.wait();

        const res = await this._onAuthorization();

        this.#authorizationMutex.unlock( res );

        return res;
    }

    async #onAccessDenied () {
        if ( !this.#accessDeniedMutex.tryLock() ) return;

        await this._onAccessDenied();

        this.#accessDeniedMutex.unlock();
    }
}
