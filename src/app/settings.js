import { reactive } from "vue";
import env from "#core/env";

export default class Settings {
    #app;
    #settings;
    #components;
    #reactive = reactive( {
        "title": "",
    } );

    constructor ( app ) {
        this.#app = app;
    }

    // properties
    get app () {
        return this.#app;
    }

    get title () {
        return this.#reactive.title;
    }

    get signupEnabled () {
        return !!this.#settings.signup_enabled;
    }

    get frontendId () {
        return {
            "buildVersion": env.getBuildVersion(),
            "mode": env.mode,
        };
    }

    get backendId () {
        return {
            "buildVersion": this.#settings.backend_build_version,
            "mode": this.#settings.backend_mode,
        };
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

        this.#reactive.title = title;
    }
}
