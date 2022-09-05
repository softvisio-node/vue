import Events from "#core/events";

const isCordova = !!window.cordova,
    firebaseBrowserConfig = process.config?.firebase?.browser;

class FirebaseMessaging extends Events {
    #api;

    // properties
    get isSupported () {
        return !!this.#api;
    }

    // public
    async init () {
        var api;

        if ( isCordova ) {
            api = await import( /* webpackChunkName: "firebase.cordova" */ "#lib/firebase/cordova" );
        }
        else if ( firebaseBrowserConfig ) {
            api = await import( /* webpackChunkName: "firebase.browser" */ "#lib/firebase/browser" );
        }
        else {
            const worker = await navigator.serviceWorker.getRegistration( "/firebase-cloud-messaging-push-scope" );

            if ( worker ) worker.unregister();
        }

        if ( !api ) return this;

        this.#api = await api.default.new( firebaseBrowserConfig );

        if ( this.#api ) {
            this.#api.on( "pushNotification", data => this.emit( "pushNotification", data ) );
        }

        return this;
    }

    async enable () {
        if ( !this.isSupported ) return false;

        return await this.#api.enable();
    }

    async disable () {
        if ( !this.isSupported ) return true;

        return await this.#api.disable();
    }
}

const firebase = await new FirebaseMessaging().init();

export default firebase;
