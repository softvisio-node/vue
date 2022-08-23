import { initializeApp } from "@firebase/app";
import { getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";

const firebaseConfig = process.config.firebase,
    firebaseApp = initializeApp( firebaseConfig );

getMessaging( firebaseApp );

// self.addEventListener( "notificationclick", function ( event ) {
//     event.notification.close();

//     var promise = new Promise( function ( resolve ) {
//         setTimeout( resolve, 1000 );
//     } ).then( function () {
//         return clients.openWindow( event.data.locator );
//     } );

//     event.waitUntil( promise );
// } );

onBackgroundMessage( ( message, payload ) => {

    // const notificationTitle = "Background Message Title";
    // const notificationOptions = {
    // "body": "Background Message body.",
    // "icon": "/firebase-logo.png",
    // };
    // self.registration.showNotification( notificationTitle, notificationOptions );
} );

// await new Promise( resolve => setTimeout( resolve, 2000 ) );
// self.postMessage( "some0data" );
