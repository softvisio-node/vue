/* eslint-disable import/first  */

import Events from "#core/events";

var api;

// #!if firebaseMessagingWorkerEnabled === true

import WebApi from "./firebase/messaging/web.js";

api = await WebApi.new();

// #!elseif isCordova === true

import CordovaApi from "./firebase/messaging/cordova.js";

api = await CordovaApi.new();

// #!else

const registration = await navigator.serviceWorker.getRegistration( "/firebase-cloud-messaging-push-scope" );
if ( registration ) registration.unregister();

// #!endif

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
