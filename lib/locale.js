import localizationRegistry from "#lib/localization/registry";
import Locale from "#core/localization/locale";

export default class extends Locale {

    // static
    static async register ( loader ) {
        try {
            const locale = new Locale( ( await loader( localizationRegistry.locale ) ).default );

            localizationRegistry.registerLocale( locale );
        }
        catch ( e ) {}
    }
}
