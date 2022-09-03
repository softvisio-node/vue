import main from "./main.config.js";
import firebaseMessagingWorker from "./firebase-messaging.worker.config.js";

main.add( firebaseMessagingWorker );

export default main;
