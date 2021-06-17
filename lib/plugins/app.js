import Events from "#core/events";

export default class App extends Events {

    // static
    install ( app, options ) {
        app.config.globalProperties.$app = new App();
    }

    // public
    publish ( name, ...args ) {
        this.emit( name, ...args );
    }
}
