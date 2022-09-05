import { initializeApp } from "@firebase/app";
import { getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";

// NOTE worker api: https://firebase.google.com/docs/reference/js/messaging_sw.md#@firebase/messaging/sw

const firebaseConfig = process.config.firebase.browser;

class Handler {
    async onBackgoundMessage ( message ) {

        // const notificationTitle = "Background Message Title";
        // const notificationOptions = {
        //     "icon": "/favicon.ico",
        //     "body": "Background Message body.",
        //     "image": "/favicon.ico",
        // };
        // return self.registration.showNotification( notificationTitle, notificationOptions );
    }

    async onClick ( event ) {
        event.notification.close();

        const url = event.action || "/",
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
}

if ( firebaseConfig ) {
    const firebaseApp = initializeApp( firebaseConfig );

    const messaging = getMessaging( firebaseApp );

    const handler = new Handler();

    onBackgroundMessage( messaging, handler.onBackgoundMessage.bind( handler ) );

    self.addEventListener( "notificationclick", event => event.waitUntil( handler.onClick( event ) ) );
}
