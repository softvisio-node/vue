import Store from "@softvisio/vuex";
import Mutex from "#core/threads/mutex";

export default class extends Store {
    #mutex = new Mutex();

    data;
    totalCount = 0;
    unreadCount = 0;

    constructor () {
        super();

        this.$api.on( "connect", this.reload.bind( this ) );
        this.$api.on( "event/notifications", this.reload.bind( this ) );
    }

    // public
    async reload () {
        if ( !this.#mutex.tryDown() ) return this.#mutex.signal.wait();

        const res = await this.$api.call( "notifications/read" );

        if ( res.ok ) this._onNotificationsUpdated( res.data );

        this.#mutex.signal.broadcast();
        this.#mutex.up();
    }

    refreshRelativeTime () {
        this.data.forEach( record => ( record.relativeTime = this._getRelativeTime( record.date ) ) );
    }

    refreshCount () {
        let unreadCount = 0;

        this.data.forEach( record => {
            if ( !record.read ) unreadCount++;
        } );

        this.totalCount = this.data.length;
        this.unreadCount = unreadCount;
    }

    // XXX
    async markUnread ( notificationId ) {
        const res = await this._markUnread( notificationId );

        return res;
    }

    // XXX
    async markRead ( notificationId ) {
        const res = await this._markRead( notificationId );

        return res;
    }

    // XXX
    async markAllRead () {}

    async delete ( notification ) {}

    // XXX
    async deleteAll () {}

    // protected
    _getRelativeTime ( date ) {
        return this.$utils.relativeTime( date - new Date() );
    }

    _onNotificationsUpdated ( data ) {
        this.data = data || [];

        this.data.forEach( record => {
            record.date = new Date( record.date );
        } );

        this.refreshCount();
        this.refreshRelativeTime();
    }

    async _markRead ( notifications ) {
        if ( !Array.isArray( notifications ) ) notifications = [notifications];

        const res = await this.$api.call( "notifications/mark-read", notifications );

        return res;
    }

    async _markUnread ( notifications ) {
        if ( !Array.isArray( notifications ) ) notifications = [notifications];

        const res = await this.$api.call( "notifications/mark-unread", notifications );

        return res;
    }

    async _delete ( notifications ) {
        if ( !Array.isArray( notifications ) ) notifications = [notifications];

        const res = await this.$api.call( "notifications/delete", notifications );

        return res;
    }
}
