import Localization from "#lib/localization";

class Local extends Localization {

    // protected
    async _loadLocale ( locale ) {
        return import( "#resources/locales/" + locale );
    }
}

await Local.new();
