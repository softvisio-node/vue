import { createApp } from "vue";
import Viewport from "@/viewport.vue";

import mount from "./plugins/mount";
import App from "./plugins/app";
import utils from "./plugins/utils";
import api from "./plugins/api";
import store from "@/store";

export default function () {
    const app = createApp( Viewport );

    app.use( mount );
    app.use( App );
    app.use( utils );
    app.use( api );
    app.use( store );

    return app;
}
