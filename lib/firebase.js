import Events from "#core/events";

const firebaseConfig = process.config.firebase;

const TOKEN_KEY = "firebaseToken";

class FirebaseMessaging extends Events {
    #api;
    #token = null;

    // properties
    get isSupported () {
        if ( !firebaseConfig || !this.#api ) return false;

        return true;
    }

    get isSubscribed () {
        return this.#token;
    }

    // public
    async init () {
        var api;

        if ( window.FirebasePlugin ) {
            api = await import( "#lib/firebase/cordova" );
        }
        else if ( firebaseConfig ) {
            api = await import( "#lib/firebase/browser" );
        }

        if ( !api ) return this;

        this.#api = await api.default.new( firebaseConfig );

        if ( this.#api ) {
            this.#token = window.localStorage.getItem( TOKEN_KEY ) || null;

            this.#api.on( "message", data => this.emit( "message", data ) );

            this.#api.on( "token", token => this.#onTokenChange( token ) );
        }

        return this;
    }

    async subscribe () {
        if ( !this.isSupported ) return false;

        const token = await this.#api.subscribe();

        this.#onTokenChange( token );

        return !!token;
    }

    async unsubscribe () {
        if ( !this.isSupported ) return true;

        await this.#api.unsubscribe();

        this.#onTokenChange( null );

        return true;
    }

    getBadgeNumber () {
        return this.#api?.getbadgenumber();
    }

    setBadgeNumber ( number ) {
        this.#api?.setbadgenumber( number || 0 );
    }

    clearAllNotifications () {
        this.#api?.clearAllNotifications();
    }

    // private
    async #onTokenChange ( token ) {
        token ||= null;

        if ( this.#token !== token ) {
            this.#token = token;

            if ( token ) {
                window.localStorage.setItem( TOKEN_KEY, token );
            }
            else {
                window.localStorage.removeItem( TOKEN_KEY );
            }

            this.emit( "subscribe", !!token );
        }
    }
}

const firebase = await new FirebaseMessaging().init();

export default firebase;
