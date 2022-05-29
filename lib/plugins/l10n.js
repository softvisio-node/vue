class L10n {
    #locale;
    #locales = [];

    // properties
    get locale () {
        return this.#locale;
    }

    // public
    async setLocale ( locale ) {
        if ( this.#locale === locale ) return;

        this.#locale = locale;

        for ( const l10n of this.#locales ) await l10n.setLocale( locale );
    }

    register ( l10n ) {
        this.#locales.push( l10n );
    }

    i18n ( single, plural, num ) {
        var translation;

        for ( const l10n of this.#locales ) {
            translation = l10n.i18n( single, plural, num );

            if ( translation ) return translation;
        }

        // fallback
        if ( plural && num != null ) {
            return plural.replaceAll( "%s", num );
        }
        else {
            return single;
        }
    }
}

const l10n = new L10n(),
    i18n = l10n.i18n.bind( l10n );

// register globally
window[Symbol.for( "L10N_REGISTRY" )] = l10n;
window.i18n = i18n;

// window.location.reload();

// init locale
const locale = window.localStorage.getItem( "locale" ) || "rus";
await l10n.setLocale( locale );

export default {
    install ( app, options ) {
        app.config.globalProperties.$l10n = l10n;

        app.config.globalProperties.i18n = window.i18n;
    },
};
