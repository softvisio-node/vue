import Localization from "#lib/localization";

class Local extends Localization {

    // static
    static async _loadLocale ( locale ) {
        return import( "#resources/locales/" + locale + ".po" );
    }
}

await Local.new();
