const REGISTRY = window[Symbol.for( "L10N_REGISTRY" )];

export default class L10n {
    #locale;
    #locales = {};

    // static
    static async new () {
        const l10n = new this();

        REGISTRY.register( l10n );

        if ( REGISTRY.locale ) await l10n.setLocale( REGISTRY.locale );

        return l10n;
    }

    // properties
    get locale () {
        return this.#locale;
    }

    // public
    async setLocale ( locale ) {
        if ( this.#locale === locale ) return;

        if ( this.#locales[locale] ) return;

        this.#locale = locale;

        try {
            const data = ( await this._loadLocale( locale ) ).default;

            this.#locales[locale] = data;
        }
        catch ( e ) {}
    }

    // XXX
    i18n ( single, plural, num ) {
        const locale = this.#locales[this.#locale];

        if ( !locale ) return;

        const translation = locale[single];

        return translation;
    }

    // protected
    async _loadLocale ( locale ) {
        return import( "#resources/l10n/" + locale + ".js" );
    }
}
