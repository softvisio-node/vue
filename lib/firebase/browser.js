import Events from "#core/events";
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "@firebase/messaging";

// NOTE main api: https://firebase.google.com/docs/reference/js/messaging_.md#@firebase/messaging

export default class extends Events {
    #messaging;
    #worker;

    // static
    static async new ( firebaseConfig ) {
        const api = new this();

        return await api.init( firebaseConfig );
    }

    // public
    async init ( firebaseConfig ) {
        if ( !( await isSupported() ) ) return;

        // #!if firebaseMessagingWorkerEnabled === true
        try {
            this.#messaging = getMessaging( initializeApp( firebaseConfig ) );

            this.#worker = await navigator.serviceWorker.register( new URL( "#tmp/firebase-messaging.worker.js", import.meta.url ), {
                "scope": "/firebase-cloud-messaging-push-scope",
            } );

            return this;
        }
        catch ( e ) {}

        // #!endif
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
