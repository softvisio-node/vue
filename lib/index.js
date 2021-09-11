import Events from "#core/events";
import { createApp } from "vue";
import Viewport from "@/viewport.vue";
import API from "#core/api";

import mount from "#lib/plugins/mount";
import utils from "#lib/plugins/utils";
import store from "@/store";

const DEFAULT_MOUNT_SELECTOR = "#app";

export default class App extends Events {
    #initialized;
    #deviceReady = false;
    #vue;
    #api;

    // static
    static async new () {
        const app = new this();

        await app.init();

        return app;
    }

    // properties
    get isCordova () {
        return !!window.cordova;
    }

    get isDeviceReady () {
        return this.#deviceReady;
    }

    get vue () {
        return this.#vue;
    }

    get api () {
        return this.#api;
    }

    // public
    async init () {
        if ( this.#initialized ) throw Error( `App is already initialized` );

        this.#initialized = true;

        if ( this.isCordova ) {
            document.addEventListener( "deviceready", this._onDeviceReady.bind( this ), false );
        }
        else {
            this._onDeviceReady();
        }

        await this.waitDeviceReady();

        this.#vue = createApp( Viewport );

        this.#vue.config.globalProperties.$app = this;

        this._initAPI();

        this.#vue.use( mount );
        this.#vue.use( utils );
        this.#vue.use( store );
    }

    mount ( selector ) {
        this.#vue.mount( selector || DEFAULT_MOUNT_SELECTOR );
    }

    publish ( name, ...args ) {
        if ( name === "api" ) {
            name = args.shift();

            this.#api.publish( name, ...args );
        }
        else {
            this.emit( name, ...args );
        }
    }

    async waitDeviceReady () {
        if ( this.#deviceReady ) return;

        return new Promise( resolve => this.once( "device/ready", resolve ) );
    }

    // protected
    _initAPI () {
        if ( !this.#api && process.env.VUE_APP_API_URL ) {
            this.#api = API.new( process.env.VUE_APP_API_URL, {
                "token": window.localStorage.getItem( "token" ),
            } );
        }

        if ( this.#api ) {
            this.#vue.config.globalProperties.$api = this.#api;

            // forward api events
            this.#api.on( "connect", () => this.emit( "api/connect" ) );
            this.#api.on( "disconnect", () => this.emit( "api/disconnect" ) );
            this.#api.on( "signout", () => this.emit( "api/signout" ) );
            this.#api.on( "event", ( name, args ) => this.emit( "api/event/" + name, ...args ) );
        }
    }

    _onDeviceReady () {
        this.#deviceReady = true;

        window.onbeforeunload = this._onDeviceUnload.bind( this );

        // register cordova events, https://cordova.apache.org/docs/en/latest/cordova/events/events.html
        if ( this.isCordova ) {
            document.addEventListener( "pause", e => this.emit( "device/pause" ), false );
            document.addEventListener( "resume", e => this.emit( "device/resume" ), false );
            document.addEventListener( "backbutton", e => this.emit( "device/back-button" ), false );
            document.addEventListener( "menubutton", e => this.emit( "device/menu-button" ), false );
            document.addEventListener( "searchbutton", e => this.emit( "device/search-button" ), false );
            document.addEventListener( "startcallbutton", e => this.emit( "device/start-call-button" ), false );
            document.addEventListener( "endcallbutton", e => this.emit( "device/end-call-button" ), false );
            document.addEventListener( "volumedownbutton", e => this.emit( "device/volume-down-button" ), false );
            document.addEventListener( "volumeupbutton", e => this.emit( "device/volume-up-button" ), false );
            document.addEventListener( "activated", e => this.emit( "device/activated" ), false );

            this._registerPushNotifications();
        }

        this.emit( "device/ready" );
    }

    // NOTE return true to prevent app unload, e.returnValue = true;
    _onDeviceUnload ( e ) {}

    _registerPushNotification () {

        // FirebasePlugin plugin is not present
        if ( !window.FirebasePlugin ) return;

        const topic = process.env.VUE_APP_PUSH_TOPIC;

        // push topic is not defined
        if ( !topic ) return;

        // subscribe
        window.FirebasePlugin.subscribe( topic,
            () => {},
            error => {
                console.log( `Unable to subscribe to the push notification topic "${topic}". ${error}` );
            } );

        // set event listener
        window.FirebasePlugin.onMessageReceived( data => {
            this.emit( "device/push", data );
        },
        error => {
            console.log( `Push notification error. ${error}` );
        } );
    }
}
