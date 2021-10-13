import Events from "#core/events";
import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, deleteToken, onMessage, isSupported } from "@firebase/messaging";
import firebaseConfig from "#lib/firebase/config";

export default class FirebaseMessaging extends Events {
    #firebaseApp;
    #firebaseMessaging;

    constructor () {
        super();

        if ( firebaseConfig ) {
            this.#firebaseMessaging = getMessaging( initializeApp( firebaseConfig ) );

            // this.#firebaseMessaging = getMessaging(  );

            onMessage( ( messaging, payload ) => this.emit( "messge", payload ) );
        }
    }

    // asks for permissions if not granted
    async getToken () {

        // XXX custom worker location
        // XXX not works under dev server
        // XXX produces warngins in the console
        // const workerUrl = new URL( "@/../www/firebase-messaging-sw.js", import.meta.url );
        // const serviceWorkerRegistration = await navigator.serviceWorker.register( workerUrl, {
        //     "scope": "/firebase-cloud-messaging-push-scope",
        // } );

        try {

            // XXX
            // const token = await getToken( this.#firebaseMessaging, { serviceWorkerRegistration } );
            const token = await getToken( this.#firebaseMessaging );

            return token;
        }
        catch ( e ) {

            // no permissions, push notification are disabled
            return;
        }
    }

    async deleteToken () {
        return deleteToken( this.#firebaseMessaging );
    }

    // returns true if platform support push notifications
    async isSupported () {
        return isSupported();
    }
}
