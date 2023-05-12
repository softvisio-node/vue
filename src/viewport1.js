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
    async init () {
        await this._initViewport();

        this.#vue = createApp( Viewport );

        this.#vue.config.globalProperties.$app = this.#app;

        this.#vue.use( localePlugin );

        this.#vue.config.globalProperties.$api = this.#app.api;

        this.#vue.config.globalProperties.$utils = this.#app.utils;

        this.#vue.use( mount );
    }

    mount ( selector ) {
        this.#vue = this.#vue.mount( selector || DEFAULT_MOUNT_SELECTOR );
    }

    // protected
    async _initViewport () {}
}
