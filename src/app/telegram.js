export default class {
    #app;
    #telegramBotId;
    #telegramBotType;
    #webAppType;
    #data;
    #token;

    constructor ( app, data ) {
        this.#app = app;

        this.#telegramBotId = data.telegramBotId;
        this.#telegramBotType = data.telegramBotType;
        this.#webAppType = data.webAppType;
        this.#data = data.data;
    }

    // static
    static async new ( app ) {
        if ( app.router.path !== "/telegram-webapp" ) return;

        // await import( /* webpackIgnore: true */ "https://telegram.org/js/telegram-web-app.js" );

        const script = document.createElement( "SCRIPT" );
        script.setAttribute( "src", "https://telegram.org/js/telegram-web-app.js" );
        script.setAttribute( "async", "" );
        script.setAttribute( "defer", "" );
        document.body.appendChild( script );

        await new Promise( resolve => {
            script.onload = resolve;
        } );

        if ( !window.Telegram.WebApp.initData ) return;

        // decode init data
        try {
            var data = JSON.parse( app.router.searchParams.get( "data" ) );
        }
        catch ( e ) {}

        // init data is not valid
        if ( !data ) {
            window.Telegram.WebApp.close();

            return;
        }

        return new this( app, data );
    }

    // properties
    get app () {
        return this.#app;
    }

    get telegramBotId () {
        return this.#telegramBotId;
    }

    get telegramBotType () {
        return this.#telegramBotType;
    }

    get webAppType () {
        return this.#webAppType;
    }

    get data () {
        return this.#data;
    }

    get token () {
        if ( this.#token === undefined ) {
            this.#token = null;

            if ( window.Telegram.WebApp.initData ) {
                this.#token = encodeURIComponent( "telegram:" +
                        JSON.stringify( {
                            "telegram_bot_id": this.telegramBotId,
                            "telegram_webapp_init_data": window.Telegram.WebApp.initData,
                        } ) );
            }
        }

        return this.#token;
    }

    // public
    close () {
        window.Telegram.WebApp.close();
    }
}
