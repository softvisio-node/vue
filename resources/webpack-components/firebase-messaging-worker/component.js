import fs from "node:fs";
import path from "node:path";
import WebpackComponent from "@softvisio/webpack/webpack-components/web-worker";
import { resolve } from "#core/utils";

export default class extends WebpackComponent {

    // properties
    get isEnabled () {
        if ( !super.isEnabled ) return false;

        if ( this.isCordova ) return false;

        if ( !this.appConfig?.firebase?.web ) return false;

        return true;
    }

    get webpackEntryImport () {
        return resolve( "#src/firebase/messaging/web.worker", import.meta.url );
    }

    get webpackEntryFilename () {
        return "firebase-messaging.worker.js";
    }

    get webpackResolveAlias () {
        return {
            ...super.webpackResolveAlias,
            "#vue": "@softvisio/vue",
        };
    }

    // public
    validateEnv ( env ) {
        return super.validateEnv( env ) || this._validateEnv( env, import.meta.url );
    }

    // protected
    _init () {
        super._init();

        this.sharedPreprocessorParams.firebaseMessagingWorkerEnabled = this.isEnabled;

        if ( this.isEnabled ) {
            this.sharedPreprocessorParams.firebaseMessagingWorkerMixin = fs.existsSync( path.join( this.context, "src/firebase-messaging.worker.js" ) );

            this.sharedResolveAlias[ "#firebaseMessagingWorker$" ] = path.join( this.tmpPath, "firebase-messaging.worker.js" );
        }
    }
}
