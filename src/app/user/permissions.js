export default class {
    #user;
    #oarentPermissions;
    #permissions;

    constructor ( user, permissions, { oarentPermissions } = {} ) {
        this.#user = user;
        this.#oarentPermissions = oarentPermissions;
        this.#permissions = new Set( permissions );
    }

    // public
    has ( permissions ) {
        if ( !this.#user.isAuthenticated ) return false;

        if ( this.#user.isRoot ) return true;

        if ( !Array.isArray( permissions ) ) permissions = [permissions];

        for ( const permission of permissions ) {
            if ( this.#permissions.has( permission ) ) return true;
        }

        if ( this.#oarentPermissions ) {
            return this.#oarentPermissions.has( permissions );
        }
        else {
            return false;
        }
    }
}
