import Store from "@softvisio/vuex";
import Mutex from "#core/threads/mutex";

export default class extends Store {
    #mutex = new Mutex();

    data;
    newNotifications = 0;

    constructor () {
        super();

        this.$api.on( "connect", this.#updateNotifications.bind( this ) );
        this.$api.on( "event/notifications", this.#updateNotifications.bind( this ) );
    }

    // public
    refreshRelativeTime () {
        this.data.forEach( record => ( record.relative_time = this._getRelativeTime( record.date ) ) );
    }

    // protected
    _getRelativeTime ( date ) {
        return this.$utils.relativeTime( date - new Date() );
    }

    _onNotificationsUpdated ( data ) {
        this.data = data || [];

        let newNotifications = 0;

        this.data.forEach( record => {
            record.date = new Date( record.date );

            if ( !record.read ) newNotifications++;
        } );

        this.newNotifications = newNotifications;
    }

    // private
    async #updateNotifications () {
        if ( !this.#mutex.tryDown() ) return;

        const res = await this.$api.call( "notifications/read" );

        if ( res.ok ) this._onNotificationsUpdated( res.data );

        this.#mutex.up();
    }
}
