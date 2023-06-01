import constants from "#core/app/constants";

export default class User {
    #app;
    #id;
    #email;
    #locale;
    #avatar;
    #permissions;

    constructor ( app, data, permissions ) {
        this.#app = app;
        this.#id = data?.id;
        this.#email = data?.email;
        this.#locale = data?.locale;
        this.#avatar = data?.avatar;
        this.#permissions = new Set( permissions );
    }

    // properties
    get id () {
        return this.#id;
    }

    get email () {
        return this.#email;
    }

    get locale () {
        return this.#locale;
    }

    get avatar () {
        return this.#avatar;
    }

    get isAuthenticated () {
        return !!this.#id;
    }

    get isRoot () {
        return this.#id === constants.rootUserId;
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
