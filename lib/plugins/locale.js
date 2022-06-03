import "#lib/locale";

export default class {

    // static
    static install ( app, options ) {
        app.config.globalProperties.msgid = window.msgid;
        app.config.globalProperties.i18n = window.i18n;
    }
}
