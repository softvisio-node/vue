import WebpackComponent from "@softvisio/webpack/components/firebase-messaging-worker";
import { resolve } from "#core/utils";

const worker = resolve( "#src/firebase/messaging/web.worker", import.meta.url );

export default class extends WebpackComponent {

    // properties
    get resolveAlias () {
        return {
            ...super.resolveAlias,
            "#vue": "@softvisio/vue",
        };
    }

    // protected
    _buildWebpackConfig ( options ) {
        const config = super._buildWebpackConfig( options );

        config.entry.firebase.import = worker;

        return config;
    }
}
