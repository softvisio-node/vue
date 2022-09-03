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

    self.addEventListener( "notificationclick", event => {
        event.notification.close();

        event.waitUntil( onClick( event ) );
    } );
}

async function onClick ( event ) {
    var url = event.action || "/",
        tag = event.notification.tag;

    const clients = await self.clients.matchAll( {
        "includeUncontrolled": true,
    } );

    var client;

    // find client
    for ( const _client of clients ) {

        // if ( url !== "/" && _client.url.indexOf( url ) >= 0 ) {
        client = _client;

        break;

        // }
    }

    // client found, set focus
    if ( client ) {
        client.focus();
    }

    // client not found, open new window
    else {
        client = self.clients.openWindow( url );
    }

    // log click
    if ( tag ) {

        // PostAction(tag, "click")
    }
}
