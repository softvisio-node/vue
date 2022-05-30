import localizationRegistry from "#lib/localization/registry";
import Locale from "#core/localization/locale";

export default class Localization extends Locale {

    // static
    static async new () {
        const locale = new this();

        await localizationRegistry.registerLocale( locale );
    }

    // public
    async loadLocale ( locale ) {
        try {
            const messages = ( await this._loadLocale( locale ) ).default;

            this._setMessages( messages );
        }
        catch ( e ) {}
    }

    // protected
    async _loadLocale ( locale ) {
        throw `_loadLocale method must be implemented in child class`;
    }
}
