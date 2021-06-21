import Events from "#core/events";

export default class App extends Events {
    #api;

    constructor ( api ) {
        super();

        // forward api events
        api.on( "connect", () => this.emit( "api/connect" ) );
        api.on( "disconnect", () => this.emit( "api/disconnect" ) );
        api.on( "signout", () => this.emit( "api/signout" ) );
        api.on( "event", ( name, args ) => this.emit( "api/event/" + name, ...args ) );

        this.#api = api;
    }

    // static
    static install ( app, options ) {
        const api = app.config.globalProperties.$api;

        app.config.globalProperties.$app = new App( api );
    }

    // public
    publish ( name, ...args ) {
        if ( name === "api" ) {
            name = args.shift();

            this.#api.publish( name, ...args );
        }
        else {
            this.emit( name, ...args );
        }
    }
}
