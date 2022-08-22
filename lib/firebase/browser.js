import Events from "#core/events";
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "@firebase/messaging";

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

            this.#worker = await navigator.serviceWorker.register( new URL( "#tmp/firebase-messaging.worker.js", import.meta.url ), {
                "scope": "/firebase-cloud-messaging-push-scope",
            } );

            onMessage( ( messaging, data ) => this.emit( "messge", data ) );

            return this;
        }
        catch ( e ) {
            return;
        }
    }

    async enable () {
        try {
            return await getToken( this.#messaging, { "serviceWorkerRegistration": this.#worker } );
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

    getBadgeNumber () {}

    setBadgeNumber ( number ) {}

    clearAllNotifications () {}
}
