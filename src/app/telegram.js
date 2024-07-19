class TelegramBot {
    #app;
    #id;
    #type;

    constructor ( app, { id, type } ) {
        this.#app = app;
        this.#id = id;
        this.#type = type;
    }

    // properties
    get app () {
        return this.#app;
    }

    get id () {
        return this.#id;
    }

    get type () {
        return this.#type;
    }
}

class TelegramBotUser {
    #bot;
    #id;
    #username;

    constructor ( bot, { id, username } ) {
        this.#bot = bot;
        this.#id = id;
        this.#username = username;
    }

    // properties
    get app () {
        return this.#bot.app;
    }

    get bot () {
        return this.#bot;
    }

    get id () {
        return this.#id;
    }

    get username () {
        return this.#username;
    }
}

export default class {
    #app;
    #bot;
    #user;
    #webAppType;
    #data;
    #token;

    constructor ( app, data ) {
        this.#app = app;

        this.#bot = new TelegramBot( this.#app, {
            "id": data.telegramBotId,
            "type": data.telegramBotType,
        } );

        this.#user = new TelegramBotUser( this.#bot, window.Telegram.WebApp.initDataUnsafe.user );

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

    get bot () {
        return this.#bot;
    }

    get user () {
        return this.#user;
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
                            "telegram_bot_id": this.bot.id,
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
