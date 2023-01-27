import { FirebaseMessagingWorker as Super } from "@softvisio/webpack/configs/firebase-messaging.worker";
import { resolve } from "#core/utils";

const worker = resolve( "#src/firebase/messaging/web.worker", import.meta.url );

export class FirebaseMessagingWorker extends Super {

    // properties
    get resolveAlias () {
        return {
            ...super.resolveAlias,
            "#vue": "@softvisio/vue",
        };
    }

    // protected
    _generate ( options ) {
        const config = super._generate( options );

        config.entry.firebase.import = worker;

        return config;
    }
}
