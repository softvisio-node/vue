import Store from "@softvisio/vuex";
import * as CONST from "@softvisio/core/const";

const TOKEN_KEY = "token";

export default class extends Store {

    // STATE
    _title;
    isAuthenticated = false;
    userId;
    username;
    avatar;
    permissions;
    settings = {};

    constructor () {
        super();

        this.title = process.env.VUE_APP_TITLE + ( process.env.NODE_ENV === "development" ? " [devel]" : "" );
    }

    get title () {
        return this._title;
    }

    set title ( title ) {
        this._title = title;

        document.title = this.title;
    }

    get isRoot () {
        return this.userId === CONST.ROOT_USER_ID || this.userId === CONST.ROOT_USER_NAME;
    }

    // GETTERS
    get hasPermissions () {
        return permissions => {

            // nothing to check
            if ( !permissions ) return false;

            if ( !Array.isArray( permissions ) ) permissions = [permissions];

            // nothing to check
            if ( !permissions.length ) return false;

            var userPermissions = this.permissions || {};

            for ( const permission of permissions ) {

                // any
                if ( permission === "*" ) return true;

                // not authenticated
                if ( permission === "!" && !this.isAuthenticated ) return true;

                // authenticated
                if ( permission === "@" && this.isAuthenticated ) return true;

                // compare
                if ( userPermissions[permission] ) return true;
            }

            return false;
        };
    }

    // PROTECTED
    _setSession ( data ) {

        // update app settings
        if ( data && data.settings ) this.settings = data.settings;

        // authenticated
        if ( data && data.user_id ) {
            this.isAuthenticated = true;
            this.userId = data.user_id;
            this.username = data.username;
            this.avatar = data.avatar;
            this.permissions = data.permissions;

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
            this.isAuthenticated = false;
            this.userId = null;
            this.username = null;
            this.avatar = null;
            this.permissions = null;
        }
    }

    // ACTIONS
    async signin ( credentials = null ) {
        var signinPermissions = null;

        // prepare signin permissions
        if ( process.env.VUE_APP_SIGNIN_PERMISSIONS ) {
            signinPermissions = process.env.VUE_APP_SIGNIN_PERMISSIONS.split( "," )
                .map( permission => permission.trim() )
                .filter( permission => !!permission );

            if ( !signinPermissions.length ) signinPermissions = null;
        }

        var res = await this.$api.call( "session/signin", credentials, signinPermissions );

        this._setSession( res.data );

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

    async setPassword ( password ) {
        var res = await this.$api.call( "profile/set-password", password );

        return res;
    }

    async signup ( data ) {
        var res = await this.$api.call( "session/signup", data );

        return res;
    }

    async sendPasswordResetEmail ( username ) {
        var res = await this.$api.call( "session/send-password-reset-email", username );

        return res;
    }

    async confirmEmailByToken ( token ) {
        var res = await this.$api.call( "session/confirm-email-by-token", token );

        return res;
    }

    async setPasswordByToken ( args ) {
        var res = await this.$api.call( "session/set-password-by-token", ...args );

        return res;
    }
}
