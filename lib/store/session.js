import Store from "@softvisio/vuex";
import env from "#core/env";
import config from "#vue/config";

export default class extends Store {
    _title;
    pushNotificationsEnabled = false;

    constructor () {
        super();

        this.title = config.app.title;
    }

    // properties
    get title () {
        return this._title;
    }

    set title ( title ) {
        document.title = title;

        if ( config.app.titleIcon ) title = config.app.titleIcon + " " + title;

        if ( env.isDevelopment ) title += "&nbsp;" + this.$utils.labelError( "dev" );

        this._title = title;
    }
}
