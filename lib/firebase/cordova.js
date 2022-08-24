import Events from "#core/events";

export default class extends Events {
    #messaging;
    #worker;

    // static
    static async new ( firebaseConfig ) {
        const api = new this();

        return await api.init( firebaseConfig );
    }

    // public
    async init () {

        // await new Promise( resolve =>
        //     document.addEventListener( "deviceready", resolve, {
        //         "once": true,
        //         "capture": true,
        //     } ) );

        if ( !window.FirebasePlugin ) return;

        this.#messaging = window.FirebasePlugin;

        this.#messaging.onMessageReceived(
            data => this.emit( "message", data ),
            e => {}
        );

        return this;
    }

    async enable () {
        return new Promise( resolve => {
            this.#messaging.getToken(
                token => resolve( token ),
                e => resolve()
            );
        } );
    }

    disable () {
        this.#messaging.unregister();

        return true;
    }
}
