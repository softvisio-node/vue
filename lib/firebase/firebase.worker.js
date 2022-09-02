import { initializeApp } from "@firebase/app";
import { getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";

// NOTE worker api: https://firebase.google.com/docs/reference/js/messaging_sw.md#@firebase/messaging/sw

const firebaseConfig = process.config.firebase.browser;

if ( firebaseConfig ) {
    const firebaseApp = initializeApp( firebaseConfig );

    const messaging = getMessaging( firebaseApp );

    onBackgroundMessage( messaging, data => {
        const notificationTitle = "Background Message Title";

        const notificationOptions = {
            "body": "Background Message body.",
            "icon": "/favicon.ico",
        };

        return self.registration.showNotification( notificationTitle, notificationOptions );
    } );
}
