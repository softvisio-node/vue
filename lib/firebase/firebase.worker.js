import { initializeApp } from "@firebase/app";
import { getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";

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

        self.registration.showNotification( notificationTitle, notificationOptions );
    } );
}
