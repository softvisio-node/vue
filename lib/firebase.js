import Events from "#core/events";

var Api;

// #!if firebaseMessagingWorkerEnabled === true

Api = ( await import( "./firebase/messaging/browser.js" ) ).default;

// #!elsif isCordova === true

if ( window.FirebasePlugin ) {
    Api = ( await import( "./firebase/messaging/cordova.js" ) ).default;
}

// #!else

const registration = await navigator.serviceWorker.getRegistration( "/firebase-cloud-messaging-push-scope" );

if ( registration ) registration.unregister();

// #!endif

const api = Api ? await Api.new() : null;

class FirebaseMessaging extends Events {
    #api;

    constructor ( api ) {
        super();

        if ( api ) {
            this.#api = api;

            this.#api.on( "pushNotification", data => this.emit( "pushNotification", data ) );
        }
    }

    // properties
    get isSupported () {
        return !!this.#api;
    }

    // public
    async enable () {
        if ( !this.isSupported ) return false;

        return await this.#api.enable();
    }

    async disable () {
        if ( !this.isSupported ) return true;

        return await this.#api.disable();
    }
}

export default new FirebaseMessaging( api );
