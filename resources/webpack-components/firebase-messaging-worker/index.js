import WebpackComponent from "@softvisio/webpack/components/firebase-messaging-worker";
import { resolve } from "#core/utils";

export default class extends WebpackComponent {

    // properties
    get entryImport () {
        return resolve( "#src/firebase/messaging/web.worker", import.meta.url );
    }

    get resolveAlias () {
        return {
            ...super.resolveAlias,
            "#vue": "@softvisio/vue",
        };
    }
}
