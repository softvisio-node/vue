import { createApp } from "vue";
import Viewport from "@/viewport.vue";

import mount from "./plugins/mount";
import api from "./plugins/api";
import App from "./plugins/app";
import utils from "./plugins/utils";
import store from "@/store";

export default function ( globalProperties = {} ) {
    const app = createApp( Viewport );

    // add global properties
    for ( const prop in globalProperties ) app.config.globalProperties[prop] = globalProperties[prop];

    app.use( mount );
    app.use( api );
    app.use( App );
    app.use( utils );
    app.use( store );

    return app;
}
