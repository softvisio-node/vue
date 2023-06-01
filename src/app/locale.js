import locale from "#vue/locale";

export default class Locale {
    #app;

    constructor ( app ) {
        this.#app = app;
    }

    // properties
    get app () {
        return this.#app;
    }

    // public
    async setLocale ( localeId ) {
        if ( this.app.user.isAuthenticated ) {
            const res = await this.app.api.call( "account/set-locale", localeId );

            if ( !res.ok ) return res;
        }

        locale.setLocale( localeId );

        return result( 200 );
    }
}
