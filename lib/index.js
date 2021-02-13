import { createApp } from "vue";
import Viewport from "@/viewport.vue";

import mount from "./plugins/mount";
import events from "./plugins/events";
import utils from "./plugins/utils";
import api from "./plugins/api";
import store from "@/store";

export default function () {
    const app = createApp( Viewport );

    app.use( mount );
    app.use( events );
    app.use( utils );
    app.use( api );
    app.use( store );

    return app;
}
