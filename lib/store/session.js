import Store from "@softvisio/vuex";
import env from "#core/env";
import constants from "#core/app/constants";
import firebase from "#lib/firebase";
import result from "#core/result";
import locale from "#vue/locale";
import uuidv4 from "#core/uuid";

const API_KEY = "apiKey",
    PUSH_NOTIFICATIONS_KEY = "pushNotifications",
    DEVICE_ID_KEY = "deviceId";

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
    pushNotificationsEnabled = false;

    constructor () {
        super();

        this.title = process.env.APP_TITLE;

        this.$api.on( "signout", () => this._dropKey() );

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
    async checkAuthentication () {
        var initPushNotifications = true;

        const res = await this.$api.call( "session/check-authentication" );

        // authenticated
        if ( res.ok ) {
            this._setSession( res.data );
        }

        // not authenticated
        else if ( res.status === 401 ) {
            this._dropKey();
            this._setSession();
        }

        // invalid key
        else if ( res.status === 4401 ) {
            await this.#disablePushNotifications();
            this._dropKey();
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
        credentials = { ...credentials, "device_id": this.getDeviceId() };

        const res = await this.$api.call( "session/signin", credentials );

        if ( res.data?.key ) {

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

        // drop API key
        this._dropKey();

        // clear session data
        this._setSession();
    }

    async signup ( data ) {
        data = { ...data, "device_id": this.getDeviceId() };

        const res = await this.$api.call( "session/signup", data );

        // signed up and signed in
        if ( res.data?.key ) {

            // drop push notifications token on auth change
            await this.#disablePushNotifications();

            this._setSession( res.data );
        }

        return res;
    }

    async setPassword ( password ) {
        return this.$api.call( "account/set-password", password );
    }

    async sendPasswordRecoveryEmail ( username ) {
        return this.$api.call( "session/send-password-recovery-email", username );
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
            this.username = data.auth.username || null;
            this.roles = new Set( data.auth.roles );
            this.avatar = data.auth.avatar || null;

            // update API key
            if ( data.key ) {

                // store api key
                window.localStorage.setItem( API_KEY, data.key );

                // use new api key
                this.$api.kay = data.kay;
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

    _dropKey () {

        // drop API key
        window.localStorage.removeItem( API_KEY );

        // set api key and disconnect
        this.$api.key = null;
    }

    // private
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

    getDeviceId () {
        var id = window.localStorage.getItem( DEVICE_ID_KEY );

        if ( !id ) {
            id = uuidv4();

            window.localStorage.setItem( DEVICE_ID_KEY, id );
        }

        return id;
    }
}
