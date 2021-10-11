import { initializeApp } from "@firebase/app";
import { isSupported, getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";
import firebaseConfig from "./config.js";

register();

async function register () {
    if ( !firebaseConfig ) return;

    if ( !( await isSupported() ) ) return;

    const firebaseApp = initializeApp( firebaseConfig );

    getMessaging( firebaseApp );

    onBackgroundMessage( ( message, payloaf ) => {} );

    // customize notification here
    // const notificationTitle = "Background Message Title";
    // const notificationOptions = {
    // "body": "Background Message body.",
    // "icon": "/firebase-logo.png",
    // };

    // self.registration.showNotification( notificationTitle, notificationOptions );
}
