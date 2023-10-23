import constants from "#core/app/constants";
import { reactive } from "vue";

export default class User {
    #app;
    #id;
    #email;
    #locale;
    #avatarUrl;
    #permissions;
    #reactive = reactive( {
        "emailConfirmed": false,
    } );

    constructor ( app, data, permissions ) {
        this.#app = app;
        this.#id = data?.id;
        this.#email = data?.email;
        this.#reactive.emailConfirmed = data?.email_confirmed ?? false;
        this.#locale = data?.locale;
        this.#avatarUrl = data?.avatar_url;
        this.#permissions = new Set( permissions );
    }

    // properties
    get id () {
        return this.#id;
    }

    get email () {
        return this.#email;
    }

    get isEmailConfirmed () {
        return this.#reactive.emailConfirmed;
    }

    get locale () {
        return this.#locale;
    }

    // XXX
    get avatar () {
        return this.#avatarUrl;
    }

    get isAuthenticated () {
        return !!this.#id;
    }

    get isRoot () {
        return this.#id === constants.rootUserId;
    }

    // public
    setEmailConfirmed ( value ) {
        this.#reactive.emailConfirmed = !!value;
    }

    // public
    hasPermissions ( permissions ) {
        if ( !this.isAuthenticated ) return false;

        if ( this.isRoot ) return true;

        if ( !Array.isArray( permissions ) ) permissions = [permissions];

        for ( const permission of permissions ) {
            if ( this.#permissions.has( permission ) ) return true;
        }

        return false;
    }
}
