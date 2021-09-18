import Store from "@softvisio/vuex";
import Mutex from "#core/threads/mutex";

export default class extends Store {
    #mutex = new Mutex();

    data;
    unreadCount = 0;

    constructor () {
        super();

        this.$api.on( "connect", this.#updateNotifications.bind( this ) );
        this.$api.on( "event/notifications", this.#updateNotifications.bind( this ) );
    }

    // public
    refreshRelativeTime () {
        this.data.forEach( record => ( record.relative_time = this._getRelativeTime( record.date ) ) );
    }

    refreshUnreadCount () {
        let unreadCount = 0;

        this.data.forEach( record => {
            if ( !record.read ) unreadCount++;
        } );

        this.unreadCount = unreadCount;
    }

    // XXX
    async readAll () {}

    // protected
    _getRelativeTime ( date ) {
        return this.$utils.relativeTime( date - new Date() );
    }

    _onNotificationsUpdated ( data ) {
        this.data = data || [];

        this.data.forEach( record => {
            record.date = new Date( record.date );
        } );

        this.refreshUnreadCount();
    }

    // XXX api request
    async _read ( unread ) {
        return { "ok": 1 };
    }

    // private
    async #updateNotifications () {
        if ( !this.#mutex.tryDown() ) return;

        const res = await this.$api.call( "notifications/read" );

        if ( res.ok ) this._onNotificationsUpdated( res.data );

        this.#mutex.up();
    }
}
