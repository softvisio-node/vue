import Events from "#core/events";

const firebaseConfig = process.config.firebase;

export default class FirebaseMessaging extends Events {
    #api;
    #token;

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
            this.#api.on( "message", data => this.emit( "message", data ) );

            this.#api.on( "token", token => this.#onTokenChange( token ) );
        }

        return this;
    }

    async subscribe () {
        if ( !this.isSupported ) return;

        if ( this.isSubscribed ) return;

        const token = await this.#api.subscribe();

        this.#onTokenChange( token );
    }

    async unsubscribe () {
        if ( !this.isSupported ) return;

        await this.#api.unsubscribe();

        this.#onTokenChange( null );
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
        this.#token = token;
    }
}
