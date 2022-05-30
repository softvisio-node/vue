import Locale from "#lib/locale";

await Locale.register( locale => import( "#resources/locales/" + locale + ".po" ) );
