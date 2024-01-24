import result from "#core/result";
import firebase from "#src/firebase";
import { reactive } from "vue";
import Counter from "#core/threads/counter";

const PUSH_NOTIFICATIONS_KEY = "pushNotifications";

export default class VueNotifications {
    _reactive = reactive( {
        "pushNotificationsUpdating": false,
        "pushNotificationsEnabled": false,
        "totalInbox": 0,
        "totalDone": 0,
    } );
    #counter;
    #app;
    #pushNotificationsData;

    constructor ( app ) {
        this.#app = app;

        // init push notifications
        this.#pushNotificationsData = JSON.parse( window.localStorage.getItem( PUSH_NOTIFICATIONS_KEY ) ) || {
            "enabled": {},
        };

        this.#counter = new Counter()
            .on( "start", () => {
                this._reactive.pushNotificationsUpdating = true;
            } )
            .on( "finish", () => {
                this._reactive.pushNotificationsUpdating = false;
            } );
    }

    // properties
    get app () {
        return this.#app;
    }

    get pushNotificationsSupported () {
        return firebase.isSupported && this.app.settings.pushNotificationsSupported;
    }

    get pushNotificationsUpdating () {
        return this._reactive.pushNotificationsUpdating;
    }

    get pushNotificationsEnabled () {
        return this._reactive.pushNotificationsEnabled;
    }

    get internalNotificationsEnabled () {
        return this.#app.settings.internalNotificationsEnabled;
    }

    get totalInbox () {
        return this._reactive.totalInbox;
    }

    get totalDone () {
        return this._reactive.totalDone;
    }

    // public
    init () {
        if ( this.internalNotificationsEnabled ) {
            this.#app.api.on( "connect", this.refresh.bind( this ) );

            this.#app.api.on( "notifications/update", this.refresh.bind( this ) );
        }

        var enable = this.#pushNotificationsData.enabled[ this.#pushNotificationsUserId ];

        if ( enable == null ) {
            if ( this.app.user.isAuthenticated ) {
                enable = this.app.config.pushNotifications.userEnabled;
            }
            else {
                enable = this.app.config.pushNotifications.guestEnabled;
            }
        }

        this.#counter.value++;

        // subscribe to the push notifications
        if ( enable ) {
            this.#enablePushNotifications();
        }
        else {
            this.disablePushNotifications( false );
        }

        this.#counter.value--;
    }

    async enablePushNotifications () {
        var res;

        this.#counter.value++;

        try {
            res = await this.#enablePushNotifications();

            if ( !res.ok ) throw res;

            this.#pushNotificationsData.enabled[ this.#pushNotificationsUserId ] = true;

            this.#storePushNotificationsData();
        }
        catch ( e ) {}

        this.#counter.value--;

        return res;
    }

    async disablePushNotifications ( user = true ) {
        var res;

        this.#counter.value++;

        try {
            if ( !firebase.isSupported ) throw result( [ 500, window.l10n( "Push notifications are not supported" ) ] );

            const disabled = await firebase.disable();

            if ( !disabled ) throw result( [ 500, window.l10n( "Error disabling push notifications" ) ] );

            this._reactive.pushNotificationsEnabled = false;

            this.#pushNotificationsData.tokenId = null;

            if ( user ) this.#pushNotificationsData.enabled[ this.#pushNotificationsUserId ] = false;

            this.#storePushNotificationsData();

            res = result( 200 );
        }
        catch ( e ) {
            res = e;
        }

        this.#counter.value--;

        return res;
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
    _getRelativeDate ( date ) {
        return this.app.locale.formatRelativeDate( date, "style:short" );
    }

    // private
    get #pushNotificationsUserId () {
        return this.app.user.id || "guest";
    }

    async #enablePushNotifications () {
        if ( !this.pushNotificationsSupported ) return result( [ 500, window.l10n( "Push notifications are not supported" ) ] );

        const token = await firebase.enable();

        // unable to get token
        if ( !token ) {
            this._reactive.pushNotificationsEnabled = false;

            return result( [ 500, window.l10n( "Push notifications are disabled in the browser settings" ) ] );
        }

        const tokenHash = token.slice( -16 ),
            tokenId = [ this.#pushNotificationsUserId, this.app.settings.pushNotificationsPrefix, tokenHash ].join( "/" );

        // token not changed and is valid
        if ( tokenId === this.#pushNotificationsData.tokenId ) {
            this._reactive.pushNotificationsEnabled = true;

            return result( 200 );
        }

        // token not changed but user or prefix changed
        else if ( this.#pushNotificationsData.tokenId?.endsWith( tokenHash ) ) {
            this._reactive.pushNotificationsEnabled = false;

            // disable old token
            const disabled = await this.disablePushNotifications( false );

            if ( !disabled.ok ) return disabled;

            return this.#enablePushNotifications();
        }

        const res = await this.app.api.call( "session/register-push-notifications-token", token );

        if ( res.ok ) {
            this.#pushNotificationsData.tokenId = tokenId;
            this.#storePushNotificationsData();

            this._reactive.pushNotificationsEnabled = true;
        }
        else {
            await this.disablePushNotifications( false );

            this._reactive.pushNotificationsEnabled = false;
        }

        return res;
    }

    #storePushNotificationsData () {
        window.localStorage.setItem( PUSH_NOTIFICATIONS_KEY, JSON.stringify( this.#pushNotificationsData ) );
    }
}
