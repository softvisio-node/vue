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

        if ( !window.Telegram?.WebApp ) return;

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

    // XXX
    get token () {
        if ( this.#token === undefined ) {
            this.#token = null;

            this.#token = encodeURIComponent( "telegram:" +
                    JSON.stringify( {
                        "telegram_bot_id": this.telegramBotId,
                        "telegram_webapp_init_data": window.Telegram.WebApp.initData,
                    } ) );

            // XXX remove
            this.#token = "telegram:" + `%7B%22telegram_bot_id%22%3A1%2C%22telegram_webapp_init_data%22%3A%22query_id%3DAAGiDA9XAAAAAKIMD1eTESVw%26user%3D%257B%2522id%2522%253A1460604066%252C%2522first_name%2522%253A%2522zdm%2522%252C%2522last_name%2522%253A%2522%2522%252C%2522username%2522%253A%2522zdm002%2522%252C%2522language_code%2522%253A%2522en%2522%252C%2522allows_write_to_pm%2522%253Atrue%257D%26auth_date%3D1720851303%26hash%3D959af089ac60dbc36cc00c3c8c47b7ec3828ac4bbb8d73c385023ae5e9a0f2e2%22%7D`;
        }

        return this.#token;
    }

    // public
    close () {
        window.Telegram.WebApp.close();
    }
}
