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

            onMessage( ( messaging, payload ) => this.emit( "messge", payload ) );
        }
    }

    // asks for permissions if not granted
    async getToken () {
        try {
            const token = await getToken( this.#firebaseMessaging );

            return token;
        }
        catch ( e ) {

            // no permissions, push notification are disabled
            return;
        }
    }

    deleteToken () {
        deleteToken( this.#firebaseMessaging );
    }

    // returns true if platform support push notifications
    async isSupported () {
        return isSupported();
    }
}
