import Store from "@softvisio/vuex";
import env from "#core/env";
import constants from "#core/app/constants";
import firebase from "#lib/firebase";
import result from "#core/result";
import locale from "#vue/locale";

const TOKEN_KEY = "apiToken",
    PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class extends Store {
    _title;
    settings = {};
    userId = null;
    username = null;
    roles = new Set();
    avatar = null;

    #pushNotificationsData;
    pushNotificationsServerSupported = false;
    pushNotificationsLocalSupported = firebase.isSupported;
    pushNotificationsEnabled = firebase.isEnabled;

    constructor () {
        super();

        this.title = process.env.APP_TITLE;

        this.$api.on( "signout", () => this._dropToken() );

        // init oush notifications
        this.#pushNotificationsData = JSON.parse( window.localStorage.getItem( PUSH_NOTIFICATIONS_KEY ) ) || {
            "enabled": {},
        };

        firebase.on( "refresh", token => this.#registerPushNotificationsToken( token ) );
    }

    // properties
    get title () {
        return this._title;
    }

    set title ( title ) {
        if ( env.isDevelopment ) title += " [devel]";

        document.title = title;

        if ( process.env.APP_TITLE_ICON ) title = process.env.APP_TITLE_ICON + " " + title;

        this._title = title;
    }

    get isRoot () {
        return this.userId === constants.rootUserId || this.userId === constants.rootUsername;
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

    get pushNotificationsSupported () {
        return this.pushNotificationsLocalSupported && this.pushNotificationsServerSupported;
    }

    // public
    async checkAuthentication () {
        var initPushNotifications = true;

        const res = await this.$api.call( "session/check-authentication" );

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

    async signin ( credentials ) {
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
        const res = await this.$api.call( "session/signup", data );

        // signed up and signed in
        if ( res.data?.token ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();

            this._setSession( res.data );
        }

        return res;
    }

    async setPassword ( password ) {
        return this.$api.call( "account/set-password", password );
    }

    async sendPasswordResetEmail ( username ) {
        return this.$api.call( "session/send-password-reset-email", username );
    }

    async confirmEmailByToken ( token ) {
        return this.$api.call( "session/confirm-email-by-token", token );
    }

    async setPasswordByToken ( args ) {
        return this.$api.call( "session/set-password-by-token", ...args );
    }

    async enablePushNotifications () {
        const res = await this.#enablePushNotifications();

        if ( !res.ok ) return res;

        this.#pushNotificationsData.enbaled[this.userId || "guest"] = true;
        this.#storePushNotificationsData();

        return res;
    }

    async disablePushNotifications () {
        const res = await this.#disablePushNotifications();

        if ( !res.ok ) return res;

        this.#pushNotificationsData.enbaled[this.userId || "guest"] = false;
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
            this.username = data.auth.username || null;
            this.roles = new Set( data.auth.roles );
            this.avatar = data.auth.avatar || null;

            // update API token
            if ( data.token ) {

                // store token
                window.localStorage.setItem( TOKEN_KEY, data.token );

                // use new token
                this.$api.token = data.token;
            }
        }

        // not authenticated
        else {
            this.userId = null;
            this.username = null;
            this.roles = new Set();
            this.avatar = null;
        }
    }

    _dropToken () {

        // drop API token
        window.localStorage.removeItem( TOKEN_KEY );

        // set token and disconnect
        this.$api.token = null;
    }

    // private
    #initPushNotifications () {
        var enable;

        if ( this.isAuthenticated ) {
            enable = this.#pushNotificationsData.enabled[this.userId] || !!process.env.APP_PUSH_NOTIFICATIONS_USER_ENABLED;
        }
        else {
            enable = this.#pushNotificationsData.enabled["guest"] || !!process.env.APP_PUSH_NOTIFICATIONS_GUEST_ENABLED;
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

        if ( !token ) {
            this.pushNotificationsEnabled = false;

            return result( [500, locale.i18nd( "vue", "Push notifications are disabled in browser settings" )] );
        }

        const res = await this.#registerPushNotificationsToken( token );

        if ( !res.ok ) return res;

        this.pushNotificationsEnabled = true;

        return res;
    }

    async #disablePushNotifications () {
        if ( !this.pushNotificationsSupported ) return result( [500, locale.i18nd( "vue", "Push notifications are not supported" )] );

        const disabled = await firebase.disable();

        if ( !disabled ) return result( [500, locale.i18nd( "vue", "Error disabling push notifications" )] );

        this.pushNotificationsEnabled = false;

        this.#pushNotificationsData.tokenId = null;
        this.#storePushNotificationsData();

        return result( 200 );
    }

    async #registerPushNotificationsToken ( token ) {
        const tokenId = token.substring( token.length - 16 ),
            storedTokenId = this.#pushNotificationsData.tokenId;

        if ( tokenId === storedTokenId ) return result( 200 );

        const res = await this.$api.call( "session/register-push-notifications-token", token );

        if ( res.ok ) {
            this.#pushNotificationsData.tokenId = tokenId;
            this.#storePushNotificationsData();

            return res;
        }
        else {
            await this.#disablePushNotifications();

            return res;
        }
    }

    #storePushNotificationsData () {
        window.localStorage.setItem( PUSH_NOTIFICATIONS_KEY, JSON.stringify( this.#pushNotificationsData ) );
    }
}
