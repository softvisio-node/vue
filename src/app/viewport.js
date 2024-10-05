import { createApp } from "vue";
import Viewport from "@/viewport.vue";
import mount from "#src/app/viewport/mount";

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
        if ( this.#vue ) throw new Error( `Vue app is already mounted` );

        const vue = this._createVauApp();

        this.#vue = vue.mount( selector || DEFAULT_MOUNT_SELECTOR );
    }

    mask () {
        this.#vue?.mask();
    }

    unmask () {
        this.#vue?.unmask();
    }

    // protected
    _createVauApp () {
        const vue = createApp( Viewport );

        vue.config.globalProperties.$app = this.#app;

        // locale
        vue.config.globalProperties.msgid = msgid;
        vue.config.globalProperties.l10n = l10n;
        vue.config.globalProperties.l10nt = l10nt;

        vue.config.globalProperties.$api = this.#app.api;

        vue.config.globalProperties.$utils = this.#app.utils;
        vue.config.globalProperties.$toast = this.#app.utils.toast;

        vue.config.globalProperties.$router = this.app.router;

        vue.use( mount );

        return vue;
    }
}
