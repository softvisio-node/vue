import "#lib/localization/registry";

export default class LocalizationPlugin {

    // static
    static install ( app, options ) {
        app.config.globalProperties.i18n = window.i18n;
    }
}
