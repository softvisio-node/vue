import Store from "@softvisio/vuex";
import Mutex from "#core/threads/mutex";

export default class extends Store {
    #mutex = new Mutex();

    constructor () {
        super();

        this.$api.on( "connect", this.#updateNotifications.bind( this ) );
        this.$api.on( "event/notifications", this.#updateNotifications.bind( this ) );
    }

    // protected
    _onNotificationsUpdated ( data ) {}

    // private
    async #updateNotifications () {
        if ( !this.#mutex.tryDown() ) return;

        const res = await this.$api.call( "notifications/read" );

        if ( res.ok ) this._onNotificationsUpdated( res.data );

        this.#mutex.down();
    }
}
