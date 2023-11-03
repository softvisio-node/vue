import app from "#app";

export default class {
    #parentPermissions;
    #permissions;

    constructor ( permissions, { parentPermissions = true } = {} ) {
        if ( parentPermissions === true ) parentPermissions = app.user.permissions;

        this.#parentPermissions = parentPermissions;
        this.#permissions = new Set( permissions );
    }

    // public
    has ( permissions ) {
        if ( !app.user.isAuthenticated ) return false;

        if ( app.user.isRoot ) return true;

        if ( Array.isArray( permissions ) ) {
            for ( const permission of permissions ) {
                if ( this.#permissions.has( permission ) ) return true;
            }
        }
        else if ( this.#permissions.has( permissions ) ) {
            return true;
        }

        if ( this.#parentPermissions ) {
            return this.#parentPermissions.has( permissions );
        }
        else {
            return false;
        }
    }

    hasAll ( permissions ) {
        for ( const permission of permissions ) {
            if ( !this.has( permission ) ) return false;
        }

        return true;
    }
}
