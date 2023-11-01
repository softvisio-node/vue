import app from "#app";

export default class {
    #checkAppUserPermissions;
    #permissions;

    constructor ( permissions, { checkAppUserPermissions = true } = {} ) {
        this.#checkAppUserPermissions = !!checkAppUserPermissions;
        this.#permissions = new Set( permissions );
    }

    // public
    has ( permissions ) {
        if ( !app.user.isAuthenticated ) return false;

        if ( app.user.isRoot ) return true;

        if ( !Array.isArray( permissions ) ) permissions = [permissions];

        for ( const permission of permissions ) {
            if ( this.#permissions.has( permission ) ) return true;
        }

        if ( this.#checkAppUserPermissions ) {
            return app.user.permissions.has( permissions );
        }
        else {
            return false;
        }
    }
}
