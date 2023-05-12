import { createApp } from "vue";
import localePlugin from "#src/plugins/locale";
import mount from "#src/plugins/mount";
import Viewport from "@/viewport.vue";

const DEFAULT_MOUNT_SELECTOR = "#app";

export default class {
    #app;
    #vue;

    constructor ( app ) {
        this.#app = app;
    }

    // properties
    get app () {
        return this.#app;
    }

    get vue () {
        return this.#vue;
    }

    // public
    async init () {}

    mount ( selector ) {
        if ( this.#vue ) throw Error( `Vue app is already mounted` );

        const vue = this._createVauApp();

        this.#vue = vue.mount( selector || DEFAULT_MOUNT_SELECTOR );
    }

    // protected
    _createVauApp () {
        const vue = createApp( Viewport );

        vue.config.globalProperties.$app = this.#app;

        vue.use( localePlugin );

        vue.config.globalProperties.$api = this.#app.api;

        vue.config.globalProperties.$utils = this.#app.utils;

        vue.use( mount );

        return vue;
    }
}
