import Store from "@softvisio/vuex";
import env from "#core/env";
import constants from "#core/app/constants";

const TOKEN_KEY = "token";

export default class extends Store {
    _title;
    settings = {};
    userId = null;
    username = null;
    permissions = {};
    avatar = null;

    #sessionUpdateId = 0;

    constructor () {
        super();

        this.title = process.env.APP_TITLE;

        this.$api.on( "signout", () => {

            // drop API token
            window.localStorage.removeItem( TOKEN_KEY );

            // set token and disconnect
            this.$api.token = null;
        } );
    }

    // properties
    get title () {
        return this._title;
    }

    set title ( title ) {
        if ( env.isDevelopment ) title += " [devel]";

        document.title = title;

        if ( process.env.APP_TITLE_ICON ) title = process.env.APP_TITLE_ICON + " " + title;

        this._title = title;
    }

    get isRoot () {
        return this.userId === constants.rootUserId || this.userId === constants.rootUsername;
    }

    get isAuthenticated () {
        return !!this.userId;
    }

    get authenticationChanged () {
        // eslint-disable-next-line no-unused-vars
        const userId = this.userId;

        // initial value after first succesfull signin
        if ( this.#sessionUpdateId <= 1 ) return false;

        return true;
    }

    get hasPermissions () {
        return permissions => {

            // nothing to check
            if ( !permissions ) return false;

            if ( !Array.isArray( permissions ) ) permissions = [permissions];

            // nothing to check
            if ( !permissions.length ) return false;

            const userPermissions = this.permissions;

            for ( const permission of permissions ) {

                // any
                if ( permission === "*" ) return true;

                // guest (not authenticated)
                else if ( permission === "guest" ) {
                    if ( !this.userId ) return true;
                }

                // user (any authenticated)
                else if ( permission === "user" ) {
                    if ( this.userId ) return true;
                }

                // root
                else if ( permission === "root" ) {
                    if ( this.isRoot ) return true;
                }

                // compare
                else {
                    if ( userPermissions[permission] ) return true;
                }
            }

            return false;
        };
    }

    // public
    async signin ( credentials = null ) {
        var signinPermissions = null;

        // prepare signin permissions
        if ( process.env.APP_SIGNIN_PERMISSIONS ) {
            signinPermissions = process.env.APP_SIGNIN_PERMISSIONS.split( "," )
                .map( permission => permission.trim() )
                .filter( permission => !!permission );

            if ( !signinPermissions.length ) signinPermissions = null;
        }

        var res = await this.$api.call( "session/signin", credentials, signinPermissions );

        // connection ok
        if ( res.ok || res.status === 401 || res.status === 403 ) {

            // this.#signinId++;

            this._setSession( res.data );
        }

        return res;
    }

    async signout () {

        // signout
        await this.$api.call( "session/signout" );

        // drop API token
        window.localStorage.removeItem( TOKEN_KEY );

        // set token and disconnect
        this.$api.token = null;

        // clear session data
        this._setSession();
    }

    async signup ( data ) {
        const res = await this.$api.call( "session/signup", data );

        // signed up and signed in
        if ( res.data.token ) this._setSession( res.data );

        return res;
    }

    async setPassword ( password ) {
        return this.$api.call( "profile/set-password", password );
    }

    async sendPasswordResetEmail ( username ) {
        return this.$api.call( "session/send-password-reset-email", username );
    }

    async confirmEmailByToken ( token ) {
        return this.$api.call( "session/confirm-email-by-token", token );
    }

    async setPasswordByToken ( args ) {
        return this.$api.call( "session/set-password-by-token", ...args );
    }

    // protected
    _setSession ( data ) {
        this.#sessionUpdateId++;

        // update app settings
        if ( data?.settings ) this.settings = data.settings;

        // authenticated
        if ( data && data.auth?.user_id ) {
            this.userId = data.auth.user_id;
            this.username = data.auth.username || null;
            this.permissions = data.auth.permissions || {};
            this.avatar = data.auth.avatar || null;

            // update API token
            if ( data.token ) {

                // store token
                window.localStorage.setItem( TOKEN_KEY, data.token );

                // use new token
                this.$api.token = data.token;
            }
        }

        // not authenticated
        else {
            this.userId = null;
            this.username = null;
            this.permissions = {};
            this.avatar = null;
        }
    }
}
