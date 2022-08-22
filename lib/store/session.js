import Store from "@softvisio/vuex";
import env from "#core/env";
import constants from "#core/app/constants";
import firebase from "#lib/firebase";

const TOKEN_KEY = "apiToken",
    PUSH_NOTIFICATIONS_ENABLED_KEY = "pushNotificationsEnabled";

export default class extends Store {
    _title;
    settings = {};
    userId = null;
    username = null;
    roles = new Set();
    avatar = null;
    isPushNotificationsSupported = firebase.isSupported;
    isPushNotificationsEnabled = firebase.isEnabled;

    constructor () {
        super();

        this.title = process.env.APP_TITLE;

        this.$api.on( "signout", () => this._dropToken() );

        // init oush notifications
        firebase.on( "enable", enabled => ( this.isPushNotificationsEnabled = enabled ) );
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

    // public
    async checkAuthentication () {
        const res = await this.$api.call( "session/check-authentication" );

        if ( res.ok ) {
            this._setSession( res.data );
        }

        // invalid token
        else if ( res.status === 401 || res.status === 4401 ) {
            this._dropToken();
            this._setSession();
        }

        const pushNotificationsEnabled = this.#getPushNotificationsStatus();

        // subscribe to the push notifications
        if ( pushNotificationsEnabled ) this.#enablePushNotifications();

        return res;
    }

    async signin ( credentials ) {
        const res = await this.$api.call( "session/signin", credentials );

        this._setSession( res.data );

        return res;
    }

    async signout () {

        // disable push notifications
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
        if ( res.data?.token ) this._setSession( res.data );

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
        const enabled = await this.#enablePushNotifications();

        this.#setPushNotificationsStatus( enabled );

        return enabled;
    }

    async disablePushNotifications () {
        const disabled = await this.#disablePushNotifications();

        this.#setPushNotificationsStatus( !disabled );

        return disabled;
    }

    // protected
    _setSession ( data ) {

        // update app settings
        if ( data?.settings ) this.settings = data.settings;

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
    async #enablePushNotifications () {
        const enabled = await firebase.enable();

        this.isPushNotificationsEnabled = enabled;

        return enabled;
    }

    async #disablePushNotifications () {
        const disabled = await firebase.disable();

        this.isPushNotificationsEnabled = !disabled;

        return disabled;
    }

    #getPushNotificationsStatus () {
        var enabled;

        if ( this.isAuthenticated ) {
            enabled = window.localStorage.getItem( `${PUSH_NOTIFICATIONS_ENABLED_KEY}_${this.userId}` );

            enabled ??= !!process.env.APP_PUSH_NOTIFICATIONS_USER_ENABLED;
        }
        else {
            enabled = window.localStorage.setItem( PUSH_NOTIFICATIONS_ENABLED_KEY );

            enabled ??= !!process.env.APP_PUSH_NOTIFICATIONS_GUEST_ENABLED;
        }

        return !!enabled;
    }

    #setPushNotificationsStatus ( enabled ) {
        if ( this.isAuthenticated ) {
            window.localStorage.setItem( `${PUSH_NOTIFICATIONS_ENABLED_KEY}_${this.userId}`, !!enabled );
        }
        else {
            window.localStorage.setItem( PUSH_NOTIFICATIONS_ENABLED_KEY, !!enabled );
        }
    }
}
