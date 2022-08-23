import { initializeApp } from "@firebase/app";
import { getMessaging, onBackgroundMessage } from "@firebase/messaging/sw";

const firebaseConfig = process.config.firebase,
    firebaseApp = initializeApp( firebaseConfig );

const messaging = getMessaging( firebaseApp );

// XXX
onBackgroundMessage( messaging, data => {} );
