import Events from "#core/events";

const firebaseConfig = process.config.firebase;

class FirebaseMessaging extends Events {
    #api;
    #isEnabled = false;

    // properties
    get isSupported () {
        if ( !firebaseConfig || !this.#api ) return false;

        return true;
    }

    get isEnabled () {
        return this.#isEnabled;
    }

    // public
    async init () {
        var api;

        if ( window.FirebasePlugin ) {
            api = await import( /* webpackChunkName: "firebase.cordova" */ "#lib/firebase/cordova" );
        }
        else if ( firebaseConfig ) {
            api = await import( /* webpackChunkName: "firebase.browser" */ "#lib/firebase/browser" );
        }

        if ( !api ) return this;

        this.#api = await api.default.new( firebaseConfig );

        if ( this.#api ) {
            this.#api.on( "message", data => this.emit( "message", data ) );

            this.#api.on( "refresh", token => this.emit( "refresh", token ) );
        }

        return this;
    }

    async enable () {
        if ( !this.isSupported ) return false;

        const token = ( await this.#api.enable() ) || null;

        this.#isEnabled = !!token;

        return token;
    }

    async disable () {
        if ( !this.isSupported ) return true;

        await this.#api.disable();

        this.#isEnabled = false;

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
}

const firebase = await new FirebaseMessaging().init();

export default firebase;
