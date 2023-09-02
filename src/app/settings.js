import Store from "#vue/store";
import env from "#core/env";

export default class Settings extends Store {
    _title;

    #app;
    #settings;
    #components;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // properties
    get app () {
        return this.#app;
    }

    get title () {
        return this._title;
    }

    get signupEnabled () {
        return !!( this.#settings.signup_enabled && this.app.config.signupEnabled );
    }

    get frontendGitId () {
        const id = env.getGitId() || {};

        id.mode = env.mode;

        return id;
    }

    get backendGitId () {
        const id = this.#settings.backend_git_id;

        id.mode = this.#settings.backend_mode;

        return id;
    }

    get locales () {
        return this.#settings.locales;
    }

    get oauthGoogleClientId () {
        return this.#settings.oauth_google_client_id;
    }

    get oauthGithubClientId () {
        return this.#settings.oauth_github_client_id;
    }

    get oauthFacebookClientId () {
        return this.#settings.oauth_facebook_client_id;
    }

    get internalNotificationsEnabled () {
        return this.#settings.internal_notifications_enabled;
    }

    get pushNotificationsSupported () {
        return this.#settings.push_notifications_supported;
    }

    get pushNotificationsPrefix () {
        return this.#settings.push_notifications_prefix;
    }

    get passwordsStrength () {
        return this.#settings.passwords_strength;
    }

    get components () {
        return ( this.#components ??= new Set( this.#settings.components ) );
    }

    // public
    setBackendSettings ( settings ) {
        this.#settings = settings || {};
    }

    setTitle ( title ) {
        document.title = title;

        if ( this.app.config.titleIcon ) title = this.app.config.titleIcon + " " + title;

        this._title = title;
    }
}
