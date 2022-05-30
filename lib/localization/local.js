import Localization from "#lib/localization";

class Local extends Localization {

    // protected
    async _loadLocale ( locale ) {
        return import( "#resources/localization/" + locale );
    }
}

await Local.new();
