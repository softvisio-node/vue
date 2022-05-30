import "#lib/localization/local";
import Events from "#core/events";
import { createApp } from "vue";
import Viewport from "@/viewport.vue";
import Api from "#core/api";

import localization from "#lib/plugins/localization";
import mount from "#lib/plugins/mount";
import * as utils from "#vue/utils";
import Store from "@/store";

const DEFAULT_MOUNT_SELECTOR = "#app";

export default class App extends Events {
    #initialized;
    #deviceReady = false;
    #vue;
    #api;
    #store;

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

        await this._initViewport();

        // wait for device ready under cordova
        if ( this.isCordova ) {
            await new Promise( resolve =>
                document.addEventListener( "deviceready", resolve, {
                    "once": true,
                    "capture": true,
                } ) );
        }

        this._onDeviceReady();

        this.#vue = createApp( Viewport );

        this.#vue.config.globalProperties.$app = this;

        this.#vue.use( localization );
        this._initApi();
        this._initUtils();
        this.#vue.use( mount );
        this.#vue.use( Store );
        this.#store = this.#vue.config.globalProperties.$store;
    }

    mount ( selector ) {
        this.#vue = this.#vue.mount( selector || DEFAULT_MOUNT_SELECTOR );
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

    async checkAuthentication () {
        while ( 1 ) {
            const res = await this.#store.session.checkAuthentication();

            if ( res.ok ) break;

            this.vue.$utils.toast( res );

            // invalid token
            if ( res.status === 401 || res.status === 4401 ) {
                await this._onInvalidToken( res );
            }

            // connection error
            else {
                await this._onConnectionError( res );
            }
        }

        // listen for api signout
        this.api.on( "signout", () => this._onSignout( true ) );
    }

    async signin ( credentials ) {
        const userId = this.#store.session.userId;

        const res = await this.#store.session.signin( credentials );

        // signed in with credentials
        if ( this.#store.session.userId && this.#store.session.userId !== userId ) {
            this._onSignin();
        }

        return res;
    }

    async signout () {
        await this.#store.session.signout();

        this._onSignout();
    }

    async signup ( data ) {
        const userId = this.#store.session.userId;

        const res = await this.#store.session.signup( data );

        if ( userId !== this.#store.session.userId ) this._onSignin();

        return res;
    }

    // protected
    async _initViewport () {}

    _initApi ( api ) {
        if ( api ) {
            this.#api = api;
        }
        else if ( process.env.APP_API_URL ) {
            this.#api = Api.new( process.env.APP_API_URL, {
                "token": window.localStorage.getItem( "token" ),
            } );
        }

        if ( this.api ) {
            this.#vue.config.globalProperties.$api = this.api;
        }
    }

    _initUtils ( _utils ) {
        this.#vue.config.globalProperties.$utils = _utils || utils;
    }

    _onDeviceReady () {
        this.#deviceReady = true;

        window.onbeforeunload = this._onDeviceUnload.bind( this );

        // register cordova events, https://cordova.apache.org/docs/en/latest/cordova/events/events.html
        if ( this.isCordova ) {
            document.addEventListener( "pause", e => this.emit( "device/pause" ) );
            document.addEventListener( "resume", e => this.emit( "device/resume" ) );
            document.addEventListener( "backbutton", e => this.emit( "device/back-button" ) );
            document.addEventListener( "menubutton", e => this.emit( "device/menu-button" ) );
            document.addEventListener( "searchbutton", e => this.emit( "device/search-button" ) );
            document.addEventListener( "startcallbutton", e => this.emit( "device/start-call-button" ) );
            document.addEventListener( "endcallbutton", e => this.emit( "device/end-call-button" ) );
            document.addEventListener( "volumedownbutton", e => this.emit( "device/volume-down-button" ) );
            document.addEventListener( "volumeupbutton", e => this.emit( "device/volume-up-button" ) );
            document.addEventListener( "activated", e => this.emit( "device/activated" ) );

            document.addEventListener( "online", e => this.emit( "device/online" ) );
            document.addEventListener( "offline", e => this.emit( "device/offline" ) );
        }
    }

    async _onConnectionError ( res ) {}

    async _onInvalidToken ( res ) {}

    _onSignin () {
        window.location.reload();
    }

    _onSignout ( auto ) {
        window.location.reload();
    }

    // NOTE return true to prevent app unload, e.returnValue = true;
    _onDeviceUnload ( e ) {}

    // XXX subscribe and send token to the server
    // XXX on server link token to the user and optionally subscribe token to the topic
    // _registerPushNotification () {

    //     // FirebasePlugin plugin is not present
    //     if ( !window.FirebasePlugin ) return;

    //     const topic = process.env.APP_PUSH_TOPIC;

    //     // push topic is not defined
    //     if ( !topic ) return;

    //     // subscribe
    //     window.FirebasePlugin.subscribe( topic,
    //         () => {},
    //         error => {
    //             console.log( `Unable to subscribe to the push notification topic "${topic}". ${error}` );
    //         } );

    //     // set event listener
    //     window.FirebasePlugin.onMessageReceived( data => {
    //         this.emit( "device/push", data );
    //     },
    //     error => {
    //         console.log( `Push notification error. ${error}` );
    //     } );
    // }
}
