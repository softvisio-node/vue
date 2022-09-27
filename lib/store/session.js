import Store from "@softvisio/vuex";
import env from "#core/env";
import constants from "#core/app/constants";
import firebase from "#lib/firebase";
import result from "#core/result";
import locale from "#vue/locale";

const API_TOKEN_KEY = "apiToken",
    PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class extends Store {
    _title;
    settings = {};
    userId = null;
    email = null;
    roles = new Set();
    avatar = null;

    #pushNotificationsData;
    pushNotificationsServerSupported = false;
    pushNotificationsLocalSupported = firebase.isSupported;
    pushNotificationsEnabled = false;

    #oauthWindow;

    constructor () {
        super();

        this.title = process.env.APP_TITLE;

        this.$api.on( "signout", () => this._dropToken() );

        // init oush notifications
        this.#pushNotificationsData = JSON.parse( window.localStorage.getItem( PUSH_NOTIFICATIONS_KEY ) ) || {
            "enabled": {},
        };
    }

    // properties
    get title () {
        return this._title;
    }

    set title ( title ) {
        document.title = title;

        if ( process.env.APP_TITLE_ICON ) title = process.env.APP_TITLE_ICON + " " + title;

        if ( env.isDevelopment ) title += "&nbsp;" + this.$utils.labelError( "dev" );

        this._title = title;
    }

    get isRoot () {
        return this.userId === constants.rootUserId;
    }

    get isAuthenticated () {
        return !!this.userId;
    }

    get hasRoles () {
        return roles => {
            if ( this.isRoot ) return true;

            // nothing to check
            if ( !roles ) return false;

            if ( !Array.isArray( roles ) ) roles = [roles];

            // nothing to check
            if ( !roles.length ) return false;

            const userRoles = this.roles;

            for ( const role of roles ) {

                // any
                if ( role === "*" ) return true;

                // guest (not authenticated)
                else if ( role === "guest" ) {
                    if ( !this.userId ) return true;
                }

                // user (any authenticated)
                else if ( role === "user" ) {
                    if ( this.userId ) return true;
                }

                // root
                else if ( role === "root" ) {
                    if ( this.isRoot ) return true;
                }

                // compare
                else {
                    if ( userRoles.has( role ) ) return true;
                }
            }

            return false;
        };
    }

    get signupEnabled () {
        return !!( this.settings.signup_enabled && process.env.APP_SIGNUP_ENABLED );
    }

    get pushNotificationsSupported () {
        return this.pushNotificationsLocalSupported && this.pushNotificationsServerSupported;
    }

    get frontendGitId () {
        const id = env.getGitId() || {};

        id.mode = env.mode;

        return id;
    }

    get backendGitId () {
        const id = this.settings.backend_git_id;

        id.mode = this.settings.backend_mode;

        return id;
    }

    // public
    async checkAuthorization () {
        var initPushNotifications = true;

        const res = await this.$api.call( "session/check-authorization" );

        // authenticated
        if ( res.ok ) {
            this._setSession( res.data );
        }

        // not authenticated
        else if ( res.status === 401 ) {
            this._dropToken();
            this._setSession();
        }

        // invalid token
        else if ( res.status === 4401 ) {
            await this.#disablePushNotifications();
            this._dropToken();
            this._setSession();
        }

        // connection error
        else {
            initPushNotifications = false;
        }

        if ( initPushNotifications ) this.#initPushNotifications();

        return res;
    }

    async _authorize ( options ) {

        // oauth
        if ( options.oauthProvider ) {
            const res = await this.#oauth( options.oauthProvider, this.email );

            if ( !res.ok ) return res;

            options = res.data;
        }

        return this.$api.call( "session/authorize", options );
    }

    async signin ( credentials ) {

        // oauth
        if ( credentials.oauthProvider ) {
            const res = await this.#oauth( credentials.oauthProvider );

            if ( !res.ok ) return res;

            credentials = res.data;
        }

        const res = await this.$api.call( "session/signin", credentials );

        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();
        }

        this._setSession( res.data );

        return res;
    }

    async signout () {

        // drop push notifications token
        await this.#disablePushNotifications();

        // signout
        await this.$api.call( "session/signout" );

        // drop API token
        this._dropToken();

        // clear session data
        this._setSession();
    }

    async signup ( data ) {

        // oauth
        if ( data.oauthProvider ) {
            const res = await this.#oauth( data.oauthProvider );

            if ( !res.ok ) return res;

            data = {
                ...data,
                ...res.data,
            };
        }

        const res = await this.$api.call( "session/signup", data );

        // signed up and signed in
        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();

            this._setSession( res.data );
        }

        return res;
    }

    async setLocale ( localeId ) {
        if ( this.isAuthenticated ) {
            const res = await this.$api.call( "account/set-locale", localeId );

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

    // protected
    _setSession ( data ) {

        // update app settings
        if ( data?.settings ) {
            this.settings = data.settings;

            this.pushNotificationsServerSupported = !!data.settings.push_notifications_supported;
        }

        // authenticated
        if ( data && data.auth?.user_id ) {
            this.userId = data.auth.user_id;
            this.email = data.auth.email || null;
            this.roles = new Set( data.auth.roles );
            this.avatar = data.auth.avatar || null;

            // update API token
            if ( data.token ) {

                // store api token
                window.localStorage.setItem( API_TOKEN_KEY, data.token );

                // use new api token
                this.$api.kay = data.kay;
            }
        }

        // not authenticated
        else {
            this.userId = null;
            this.email = null;
            this.roles = new Set();
            this.avatar = null;
        }
    }

    _dropToken () {

        // drop API token
        window.localStorage.removeItem( API_TOKEN_KEY );

        // set api token and disconnect
        this.$api.token = null;
    }

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

        var providerUrl;

        // google
        // XXX email hint
        if ( oauthProvider === "google" ) {
            providerUrl = new URL( "https://accounts.google.com/o/oauth2/auth" );

            providerUrl.searchParams.set( "response_type", "code" );

            providerUrl.searchParams.set( "client_id", this.settings.oauth_google_client_id );

            providerUrl.searchParams.set(
                "scope",
                [

                    //
                    "https://www.googleapis.com/auth/userinfo.email", // access email
                    "https://www.googleapis.com/auth/userinfo.profile", // access profile
                ].join( " " )
            );

            providerUrl.searchParams.set( "redirect_uri", oauthUrl.href );
        }

        if ( !providerUrl ) return result( [400, locale.i18nd( `vue`, `OAuth provider is not supported` )] );

        const oauthWindow = ( this.#oauthWindow = window.open( oauthUrl, null, "toolbar=no, menubar=no, width=600, height=700" ) );
        oauthWindow.focus();

        const loaded = await new Promise( resolve => {
            const interval = setInterval( () => {
                if ( !oauthWindow.closed ) return;

                clearInterval( interval );

                resolve( false );
            }, 300 );

            window.addEventListener(
                "message",
                e => {
                    if ( e.source !== oauthWindow ) return;

                    if ( !e.data?.loaded ) return;

                    clearInterval( interval );

                    oauthWindow.postMessage( { "providerUrl": providerUrl.href } );

                    resolve( true );
                },
                { "once": true }
            );
        } );

        if ( !loaded ) return result( [400, locale.i18nd( "vue", "Authorization cancelled" )] );

        const params = await new Promise( resolve => {
            const interval = setInterval( () => {
                if ( !oauthWindow.closed ) return;

                clearInterval( interval );

                resolve();
            }, 300 );

            window.addEventListener(
                "message",
                e => {
                    if ( e.source !== oauthWindow ) return;

                    if ( !e.data?.loaded ) return;

                    clearInterval( interval );

                    oauthWindow.close();

                    resolve( new URLSearchParams( e.data?.params ) );
                },
                { "once": true }
            );
        } );

        if ( !params ) return result( [400, locale.i18nd( "vue", "Authorization cancelled" )] );

        return result( 200, {
            oauthProvider,
            "oauthCode": params.get( "code" ),
        } );
    }

    get #pushNotificationsUserId () {
        return this.userId || "guest";
    }

    #initPushNotifications () {
        var enable = this.#pushNotificationsData.enabled[this.#pushNotificationsUserId];

        if ( enable == null ) {
            if ( this.isAuthenticated ) {
                enable = !!process.env.APP_PUSH_NOTIFICATIONS_USER_ENABLED;
            }
            else {
                enable = !!process.env.APP_PUSH_NOTIFICATIONS_GUEST_ENABLED;
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
        if ( !this.pushNotificationsSupported ) return result( [500, locale.i18nd( "vue", "Push notifications are not supported" )] );

        const token = await firebase.enable();

        // unable to get token
        if ( !token ) {
            this.pushNotificationsEnabled = false;

            return result( [500, locale.i18nd( "vue", "Push notifications are disabled in browser settings" )] );
        }

        const tokenId = token.substring( token.length - 16 ),
            userId = this.#pushNotificationsUserId;

        // token not changed
        if ( tokenId === this.#pushNotificationsData.tokenId ) {

            // token is valid for current user
            if ( userId === this.#pushNotificationsData.userId ) {
                this.pushNotificationsEnabled = true;

                return result( 200 );
            }

            // token is not valid for current user
            else {
                this.pushNotificationsEnabled = false;

                // disable old token
                const disabled = await this.#disablePushNotifications();

                if ( !disabled.ok ) return disabled;

                return this.#enablePushNotifications();
            }
        }

        const res = await this.$api.call( "session/register-push-notifications-token", token );

        if ( res.ok ) {
            this.#pushNotificationsData.tokenId = tokenId;
            this.#pushNotificationsData.userId = this.#pushNotificationsUserId;
            this.#storePushNotificationsData();

            this.pushNotificationsEnabled = true;
        }
        else {
            await this.#disablePushNotifications();

            this.pushNotificationsEnabled = false;
        }

        return res;
    }

    async #disablePushNotifications () {
        if ( !this.pushNotificationsSupported ) return result( [500, locale.i18nd( "vue", "Push notifications are not supported" )] );

        const disabled = await firebase.disable();

        if ( !disabled ) return result( [500, locale.i18nd( "vue", "Error disabling push notifications" )] );

        this.pushNotificationsEnabled = false;

        this.#pushNotificationsData.tokenId = null;
        this.#pushNotificationsData.userId = null;
        this.#storePushNotificationsData();

        return result( 200 );
    }

    #storePushNotificationsData () {
        window.localStorage.setItem( PUSH_NOTIFICATIONS_KEY, JSON.stringify( this.#pushNotificationsData ) );
    }
}
