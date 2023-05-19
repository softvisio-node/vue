import Store from "#vue/store";
import env from "#core/env";

export default class Settings extends Store {
    title;

    #app;
    #settings;

    constructor ( app ) {
        super();

        this.#app = app;
    }

    // static
    static new ( ...args ) {
        return super.new( "settings", ...args );
    }

    // properties
    get app () {
        return this.#app;
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

    get oauthGoogleClientId () {
        return this.#settings.oauth_google_client_id;
    }

    get oauthGithubClientId () {
        return this.#settings.oauth_github_client_id;
    }

    // public
    set ( settings ) {
        this.#settings = settings || {};
    }

    setTitle ( title ) {
        document.title = title;

        if ( this.app.config.titleIcon ) title = this.app.config.titleIcon + " " + title;

        this.title = title;
    }
}
