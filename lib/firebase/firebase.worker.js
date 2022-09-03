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

    self.onnotificationclick = event => {
        event.notification.close();

        // This looks to see if the current is already open and focuses if it is
        event.waitUntil( self.clients
            .matchAll( {
                "type": "window",
            } )
            .then( clientList => {
                for ( const client of clientList ) {
                    if ( client.url === "/" && "focus" in client ) return client.focus();
                }

                if ( self.clients.openWindow ) return self.clients.openWindow( "/" );
            } ) );
    };
}
