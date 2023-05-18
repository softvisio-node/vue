import locale from "#src/locale";
import Events from "#core/events";
import Mutex from "#core/threads/mutex";
import * as utils from "#vue/utils";
import config from "#vue/config";
import Api from "#core/api";
import uuidv4 from "#core/uuid";
import result from "#core/result";
import constants from "#core/app/constants";
import env from "#core/env";
import firebase from "#src/firebase";
import Viewport from "#vue/app/viewport";
import Session from "#src/app/session";
import Theme from "#src/app/theme";

const API_TOKEN_KEY = "apiToken",
    PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class VueApp extends Events {
    #initialized;
    #deviceReady = false;
    #session;
    #theme;
    #api;
    #settings = {};
    #user = {};
    #permissions = new Set();
    #authorizationMutex = new Mutex();
    #insufficientPermissionsMutex = new Mutex();
    #oauthWindow;
    #signingOut;
    #pushNotificationsData;
    #viewport;

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

    get session () {
        return this.#session;
    }

    get theme () {
        return this.#theme;
    }

    get utils () {
        return utils;
    }

    get api () {
        return this.#api;
    }

    get config () {
        return config;
    }

    get settings () {
        return this.#settings;
    }

    get user () {
        return this.#user;
    }

    get isAuthenticated () {
        return !!this.#user.id;
    }

    get isRoot () {
        return this.#user.id === constants.rootUserId;
    }

    get signupEnabled () {
        return !!( this.#settings.signup_enabled && config.signupEnabled );
    }

    get frontendGitId () {
        const id = env.getGitId() || {};

        id.mode = env.mode;

        return id;
    }

    get backendGitId () {
        const id = this.#settings.backend_git_id;

        id.mode = this.#settings.backend_mode;

        return id;
    }

    get internalChannelEnabled () {
        return this.#settings.internal_notifications_channel_enabled;
    }

    get pushNotificationsEnabled () {
        return firebase.isSupported && this.#settings.push_notifications_enabled;
    }

    // public
    async init () {
        if ( this.#initialized ) throw Error( `App is already initialized` );

        this.#initialized = true;

        // session
        this.#session = Session.new( "session" );

        // theme
        this.#theme = Theme.new( "theme" );

        // create viewport
        this.#viewport = new Viewport( this );
        await this.#viewport.init();

        // init push notifications
        this.#pushNotificationsData = JSON.parse( window.localStorage.getItem( PUSH_NOTIFICATIONS_KEY ) ) || {
            "enabled": {},
        };

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
                "token": window.localStorage.getItem( API_TOKEN_KEY ),
                "onAuthorization": this.#onAuthorization.bind( this ),
            } );
        }

        this.setTitle( config.title );
    }

    mount ( selector ) {
        this.#viewport.mount( selector );
    }

    reload () {
        window.location.reload();
    }

    publish ( name, ...args ) {
        if ( name === "api" ) {
            name = args.shift();

            this.#api.publish( name, ...args );
        }
        else {
            this.emit( name, ...args );
        }
    }

    async initSession () {
        while ( 1 ) {
            const res = await this.#api.call( "session/check-authorization" );

            // context is disabled or deleted
            if ( res.status === -32813 || res.status === -32815 ) {
                await this.#signout( { res, "showAlert": true } );
            }

            // connected
            else if ( res.ok ) {
                this.#settings = res.data.settings;

                this.#user = res.data.user || {};
                this.#permissions = new Set( res.data.permissions );

                break;
            }

            // connection error
            else {
                await this._onConnectionError( res );
            }
        }

        this.#api.on( "sessionDisabled", this.#signout.bind( this, { "showAlert": true } ) );
        this.#api.on( "sessionDeleted", this.#signout.bind( this, { "showAlert": true } ) );
        this.#api.on( "insufficientPermissions", this.#onInsufficientPermissions.bind( this ) );

        this.#initPushNotifications();
    }

    hasPermissions ( permissions ) {
        if ( !this.isAuthenticated ) return false;

        if ( this.isRoot ) return true;

        if ( !Array.isArray( permissions ) ) permissions = [permissions];

        for ( const permission of permissions ) {
            if ( this.#permissions.has( permission ) ) return true;
        }

        return false;
    }

    setTitle ( title ) {
        document.title = title;

        if ( config.titleIcon ) title = config.titleIcon + " " + title;

        this.#session.title = title;
    }

    async authorize ( options ) {

        // oauth
        if ( options.oauthProvider ) {
            const res = await this.#oauth( options.oauthProvider, this.email );

            if ( !res.ok ) return res;

            options = res.data;
        }

        return this.#api.call( "session/authorize", options );
    }

    async signin ( credentials ) {

        // oauth
        if ( credentials.oauthProvider ) {
            const res = await this.#oauth( credentials.oauthProvider );

            if ( !res.ok ) return res;

            credentials = res.data;
        }

        const res = await this.#api.call( "session/signin", credentials );

        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();

            // store api token
            window.localStorage.setItem( API_TOKEN_KEY, res.data.token );

            // reload
            this.reload();
        }

        return res;
    }

    async signout () {
        this.#signout( { "doSignOut": true } );
    }

    async signup ( email, fields ) {

        // oauth
        if ( email.oauthProvider ) {
            const res = await this.#oauth( email.oauthProvider );

            if ( !res.ok ) return res;

            email = res.data;
        }

        const res = await this.#api.call( "session/signup", email, fields );

        // signed up and signed in
        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();

            // store api token
            window.localStorage.setItem( API_TOKEN_KEY, res.data.token );

            // reload
            this.reload();
        }

        return res;
    }

    async setLocale ( localeId ) {
        if ( this.isAuthenticated ) {
            const res = await this.#api.call( "account/set-locale", localeId );

            if ( !res.ok ) return res;
        }

        locale.setLocale( localeId );

        return result( 200 );
    }

    async enablePushNotifications () {
        const res = await this.#enablePushNotifications();

        if ( !res.ok ) return res;

        this.#pushNotificationsData.enabled[this.#pushNotificationsUserId] = true;

        this.#storePushNotificationsData();

        return res;
    }

    async disablePushNotifications () {
        const res = await this.#disablePushNotifications();

        if ( !res.ok ) return res;

        this.#pushNotificationsData.enabled[this.#pushNotificationsUserId] = false;

        this.#storePushNotificationsData();

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

        return this.utils.alert( window.i18nd( `vue`, `Unable to connect to the API server. Check, that you have internet connection.` ), {
            "title": window.i18nd( `vue`, `Connection error` ),
        } );
    }

    async _onSignout ( res ) {
        if ( res ) this.utils.toast( res );

        await this.utils.alert( window.i18nd( `vue`, `Your session was terminated on the API server.` ), {
            "title": window.i18nd( `vue`, `Session closed` ),
        } );

        Ext.Viewport.mask();
    }

    // NOTE return true to prevent app unload, e.returnValue = true;
    _onDeviceUnload ( e ) {}

    _onAuthorization () {
        return false;
    }

    async _onInsufficientPermissions () {}

    // private
    async #oauth ( oauthProvider, email ) {

        // close pending oauth
        if ( this.#oauthWindow ) {
            if ( !this.#oauthWindow.closed ) this.#oauthWindow.close();

            this.#oauthWindow = null;
        }

        const oauthUrl = new URL( window.location.href );
        oauthUrl.pathname = "/api/oauth.html";
        oauthUrl.search = "";
        oauthUrl.hash = "";

        const state = uuidv4();

        var providerUrl;

        // google, https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient
        if ( oauthProvider === "google" ) {
            providerUrl = new URL( "https://accounts.google.com/o/oauth2/auth" );

            providerUrl.searchParams.set( "state", state );
            providerUrl.searchParams.set( "client_id", this.settings.oauth_google_client_id );
            providerUrl.searchParams.set( "redirect_uri", oauthUrl.href );

            if ( email ) providerUrl.searchParams.set( "login_hint", email );

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
            providerUrl.searchParams.set( "client_id", this.settings.oauth_github_client_id );
            providerUrl.searchParams.set( "redirect_uri", oauthUrl.href );

            if ( email ) providerUrl.searchParams.set( "login", email );

            providerUrl.searchParams.set(
                "scope",
                [

                    //
                    "user:email", // access email
                ].join( " " )
            );
        }

        if ( !providerUrl ) return result( [400, window.i18nd( `vue`, `Authorization provider is not supported` )] );

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

        if ( !params ) return result( [400, window.i18nd( "vue", "Authorization cancelled" )] );

        if ( !params.get( "code" ) ) return result( [400, window.i18nd( "vue", "Authorization cancelled" )] );

        if ( params.get( "state" ) !== state ) return result( [400, window.i18nd( "vue", "Authorization cancelled" )] );

        return result( 200, {
            "oauth_provider": oauthProvider,
            "oauth_code": params.get( "code" ),
            "oauth_redirect_uri": oauthUrl.href,
        } );
    }

    async #signout ( { res, showAlert, doSignOut } = {} ) {
        if ( this.#signingOut ) return;

        this.#signingOut = true;

        if ( showAlert ) await this._onSignout( res );

        // disable push notifications
        await this.#disablePushNotifications();

        // sign out
        if ( doSignOut ) await this.#api.call( "session/signout" );

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

    async #onInsufficientPermissions () {
        if ( !this.#insufficientPermissionsMutex.tryLock() ) return;

        await this._onInsufficientPermissions();

        this.#insufficientPermissionsMutex.unlock();
    }

    get #pushNotificationsUserId () {
        return this.#user.id || "guest";
    }

    #initPushNotifications () {
        var enable = this.#pushNotificationsData.enabled[this.#pushNotificationsUserId];

        if ( enable == null ) {
            if ( this.isAuthenticated ) {
                enable = config.pushNotifications.userEnabled;
            }
            else {
                enable = config.pushNotifications.guestEnabled;
            }
        }

        // subscribe to the push notifications
        if ( enable ) {
            this.#enablePushNotifications();
        }
        else {
            this.#disablePushNotifications();
        }
    }

    async #enablePushNotifications () {
        if ( !this.pushNotificationsEnabled ) return result( [500, window.i18nd( "vue", "Push notifications are not supported" )] );

        const token = await firebase.enable();

        // unable to get token
        if ( !token ) {
            this.#session.pushNotificationsEnabled = false;

            return result( [500, window.i18nd( "vue", "Push notifications are disabled in the browser settings" )] );
        }

        const tokenHash = token.slice( -16 ),
            tokenId = [this.#pushNotificationsUserId, this.#settings.push_notifications_prefix, tokenHash].join( "/" );

        // token not changed and is valid
        if ( tokenId === this.#pushNotificationsData.tokenId ) {
            this.#session.pushNotificationsEnabled = true;

            return result( 200 );
        }

        // token not changed but user or prefix changed
        else if ( this.#pushNotificationsData.tokenId?.endsWith( tokenHash ) ) {
            this.#session.pushNotificationsEnabled = false;

            // disable old token
            const disabled = await this.#disablePushNotifications();

            if ( !disabled.ok ) return disabled;

            return this.#enablePushNotifications();
        }

        const res = await this.#api.call( "session/register-push-notifications-token", token );

        if ( res.ok ) {
            this.#pushNotificationsData.tokenId = tokenId;
            this.#storePushNotificationsData();

            this.#session.pushNotificationsEnabled = true;
        }
        else {
            await this.#disablePushNotifications();

            this.#session.pushNotificationsEnabled = false;
        }

        return res;
    }

    async #disablePushNotifications () {
        if ( !this.pushNotificationsEnabled ) return result( [500, window.i18nd( "vue", "Push notifications are not supported" )] );

        const disabled = await firebase.disable();

        if ( !disabled ) return result( [500, window.i18nd( "vue", "Error disabling push notifications" )] );

        this.#session.pushNotificationsEnabled = false;

        this.#pushNotificationsData.tokenId = null;
        this.#storePushNotificationsData();

        return result( 200 );
    }

    #storePushNotificationsData () {
        window.localStorage.setItem( PUSH_NOTIFICATIONS_KEY, JSON.stringify( this.#pushNotificationsData ) );
    }
}
