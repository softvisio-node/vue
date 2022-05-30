import localizationRegistry from "#lib/localization/registry";
import Locale from "#core/localization/locale";

export default class Localization extends Locale {

    // static
    static async new () {
        try {
            const locale = new Locale( ( await this._loadLocale( localizationRegistry.locale ) ).default );

            localizationRegistry.registerLocale( locale );
        }
        catch ( e ) {}
    }
}
