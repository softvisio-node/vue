import Events from "#core/events";
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "@firebase/messaging";
import firebaseMessagingWorker from "#tmp/firebase-messaging.worker.js";
import config from "#vue/config";

// NOTE main api: https://firebase.google.com/docs/reference/js/messaging_.md#@firebase/messaging

export default class extends Events {
    #messaging;
    #worker;

    // static
    static async new () {
        const api = new this();

        return api.init();
    }

    // public
    async init () {
        if ( !( await isSupported() ) ) return;

        this.#messaging = getMessaging( initializeApp( config.firebase.browser ) );

        this.#worker = await navigator.serviceWorker.register( firebaseMessagingWorker, {
            "scope": "/firebase-cloud-messaging-push-scope",
        } );

        return this;
    }

    async enable () {
        try {
            const token = await getToken( this.#messaging, { "serviceWorkerRegistration": this.#worker } );

            if ( token ) {
                onMessage( this.#messaging, data => this.emit( "pushNotification", data ) );
            }

            return token;
        }
        catch ( e ) {

            // no permissions, push notification are disabled
            return;
        }
    }

    async disable () {
        try {
            return await deleteToken( this.#messaging );
        }
        catch ( e ) {}
    }
}
