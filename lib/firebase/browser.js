import Events from "#core/events";
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "@firebase/messaging";

// NOTE main api: https://firebase.google.com/docs/reference/js/messaging_.md#@firebase/messaging
// NOTE worker api: https://firebase.google.com/docs/reference/js/messaging_sw.md#@firebase/messaging/sw

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

        try {
            this.#messaging = getMessaging( initializeApp( firebaseConfig ) );

            this.#worker = await navigator.serviceWorker.register( new URL( "./firebase.worker.js", import.meta.url ), {
                "scope": "/firebase-cloud-messaging-push-scope",
            } );

            // this.#worker = await navigator.serviceWorker.register( new URL( "#tmp/firebase-messaging.worker.js", import.meta.url ), {
            //     "scope": "/firebase-cloud-messaging-push-scope",
            // } );

            return this;
        }
        catch ( e ) {}
    }

    async enable () {
        try {
            const token = await getToken( this.#messaging, { "serviceWorkerRegistration": this.#worker } );

            if ( token ) {
                onMessage( this.#messaging, data => this.emit( "messge", data ) );
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
            await deleteToken( this.#messaging );
        }
        catch ( e ) {}
    }
}
