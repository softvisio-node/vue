import result from "#core/result";
import Store from "#vue/store";
import firebase from "#src/firebase";
import locale from "#vue/locale";

const PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class VueNotifications extends Store {
    _pushNotificationsEnabled = false;
    _totalInbox = 0;
    _totalDone = 0;

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
        return firebase.isSupported && this.app.settings.pushNotificationsEnabled;
    }

    get pushNotificationsEnabled () {
        return this._pushNotificationsEnabled;
    }

    get internalNotificationsEnabled () {
        return this.#app.settings.internalNotificationsEnabled;
    }

    get totalInbox () {
        return this._totalInbox;
    }

    get totalDone () {
        return this._totalDone;
    }

    // public
    init () {
        if ( this.internalNotificationsEnabled ) {
            this.#app.api.on( "connect", this.refresh.bind( this ) );

            this.#app.api.on( "notifications/update", this.refresh.bind( this ) );
        }

        var enable = this.#pushNotificationsData.enabled[this.#pushNotificationsUserId];

        if ( enable == null ) {
            if ( this.app.user.isAuthenticated ) {
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

    refresh ( { inbox, done } = {} ) {}

    refreshRelativeTime () {}

    async updateNotifications ( options ) {
        const res = await this.#app.api.call( "account/notifications/update", options );

        if ( !res.ok ) {
            this.#app.utils.toast( res );
        }
        else {
            this.refresh( res.data );
        }
    }

    async deleteNotification ( options ) {
        const res = await this.#app.api.call( "account/notifications/delete", options );

        if ( !res.ok ) {
            this.#app.utils.toast( res );
        }
        else {
            this.refresh( res.data );
        }
    }

    // protected
    _getRelativeTime ( date ) {
        return locale.formatRelativeTime( date, "style:short" );
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
            tokenId = [this.#pushNotificationsUserId, this.app.settings.pushNotificationsPrefix, tokenHash].join( "/" );

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
