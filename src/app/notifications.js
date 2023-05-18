import result from "#core/result";
import Store from "#vue/store";
import firebase from "#src/firebase";

const PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class VueNotifications extends Store {
    _pushNotificationsEnabled = false;

    #app;
    #pushNotificationsData;

    constructor ( app ) {
        super();

        this.#app = app;

        // init push notifications
        this.#pushNotificationsData = JSON.parse( window.localStorage.getItem( PUSH_NOTIFICATIONS_KEY ) ) || {
            "enabled": {},
        };
    }

    // static
    static new ( ...args ) {
        return super.new( "notifications", ...args );
    }

    // properties
    get app () {
        return this.#app;
    }

    get pushNotificationsSupported () {
        return firebase.isSupported && this.app.settings.push_notifications_enabled;
    }

    get pushNotificationsEnabled () {
        return this._pushNotificationsEnabled;
    }

    // public
    initPushNotifications () {
        var enable = this.#pushNotificationsData.enabled[this.#pushNotificationsUserId];

        if ( enable == null ) {
            if ( this.isAuthenticated ) {
                enable = this.app.config.pushNotifications.userEnabled;
            }
            else {
                enable = this.app.config.pushNotifications.guestEnabled;
            }
        }

        // subscribe to the push notifications
        if ( enable ) {
            this.#enablePushNotifications();
        }
        else {
            this.disablePushNotifications( false );
        }
    }

    async enablePushNotifications () {
        const res = await this.#enablePushNotifications();

        if ( !res.ok ) return res;

        this.#pushNotificationsData.enabled[this.#pushNotificationsUserId] = true;

        this.#storePushNotificationsData();

        return res;
    }

    async disablePushNotifications ( user = true ) {
        if ( !this.pushNotificationsSupported ) return result( [500, window.i18nd( "vue", "Push notifications are not supported" )] );

        const disabled = await firebase.disable();

        if ( !disabled ) return result( [500, window.i18nd( "vue", "Error disabling push notifications" )] );

        this._pushNotificationsEnabled = false;

        this.#pushNotificationsData.tokenId = null;
        if ( user ) this.#pushNotificationsData.enabled[this.#pushNotificationsUserId] = false;
        this.#storePushNotificationsData();

        return result( 200 );
    }

    // private
    get #pushNotificationsUserId () {
        return this.app.user.id || "guest";
    }

    async #enablePushNotifications () {
        if ( !this.pushNotificationsSupported ) return result( [500, window.i18nd( "vue", "Push notifications are not supported" )] );

        const token = await firebase.enable();

        // unable to get token
        if ( !token ) {
            this._pushNotificationsEnabled = false;

            return result( [500, window.i18nd( "vue", "Push notifications are disabled in the browser settings" )] );
        }

        const tokenHash = token.slice( -16 ),
            tokenId = [this.#pushNotificationsUserId, this.app.settings.push_notifications_prefix, tokenHash].join( "/" );

        // token not changed and is valid
        if ( tokenId === this.#pushNotificationsData.tokenId ) {
            this._pushNotificationsEnabled = true;

            return result( 200 );
        }

        // token not changed but user or prefix changed
        else if ( this.#pushNotificationsData.tokenId?.endsWith( tokenHash ) ) {
            this._pushNotificationsEnabled = false;

            // disable old token
            const disabled = await this.disablePushNotifications( false );

            if ( !disabled.ok ) return disabled;

            return this.#enablePushNotifications();
        }

        const res = await this.app.api.call( "session/register-push-notifications-token", token );

        if ( res.ok ) {
            this.#pushNotificationsData.tokenId = tokenId;
            this.#storePushNotificationsData();

            this._pushNotificationsEnabled = true;
        }
        else {
            await this.disablePushNotifications( false );

            this._pushNotificationsEnabled = false;
        }

        return res;
    }

    #storePushNotificationsData () {
        window.localStorage.setItem( PUSH_NOTIFICATIONS_KEY, JSON.stringify( this.#pushNotificationsData ) );
    }
}
