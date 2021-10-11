import { initializeApp } from "@firebase/app";
import { getMessaging, getToken, onMessage } from "@firebase/messaging";
import firebaseConfig from "./config.js";

register();

async function register () {
    if ( !firebaseConfig ) return;

    const firebaseApp = initializeApp( firebaseConfig ),
        messaging = getMessaging( firebaseApp );

    const token = await getToken( messaging );
    console.log( token );

    onMessage( ( messaging, payload ) => {
        console.log( "Message received. ", payload );
    } );
}
