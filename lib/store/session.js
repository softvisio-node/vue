import Store from "#softvisio/store";
const TOKEN_KEY = "token";

export default class extends Store {

    // STATE
    isAuthenticated = false;
    userId;
    username;
    avatar;
    permissions;
    settings = {};

    // GETTERS
    GET_hasPermissions ( state ) {
        return permissions => {

            // root user
            if ( state.userId === 1 ) return true;

            // nothing to check
            if ( !permissions ) return false;

            if ( !Array.isArray( permissions ) ) permissions = [permissions];

            // nothing to check
            if ( !permissions.length ) return false;

            var userPermissions = state.permissions || {};

            for ( const permission of permissions ) {

                // any
                if ( permission === "*" ) return true;

                // not authenticated
                if ( permission === "!" && !state.isAuthenticated ) return true;

                // authenticated
                if ( permission === "@" && state.isAuthenticated ) return true;

                // compare
                if ( userPermissions[permission] ) return true;
            }

            return false;
        };
    }

    // MUTATIONS
    SET__setSession ( state, data ) {

        // update app settings
        if ( data && data.settings ) state.settings = data.settings;

        // authenticated
        if ( data && data.user_id ) {
            state.isAuthenticated = true;
            state.userId = data.user_id;
            state.username = data.username;
            state.avatar = data.avatar;
            state.permissions = data.permissions;

            // update API token
            if ( data.token ) {

                // store token
                window.localStorage.setItem( TOKEN_KEY, data.token );

                // use new token
                this.$api.setToken( data.token );
            }
        }

        // not authenticated
        else {
            state.isAuthenticated = false;
            state.userId = null;
            state.username = null;
            state.avatar = null;
            state.permissions = null;
        }
    }

    // ACTIONS
    async ACTION_signin ( ctx, credentials = null ) {
        var signinPermissions = null;

        // prepare signin permissions
        if ( process.env.VUE_APP_SIGNIN_PERMISSIONS ) {
            signinPermissions = process.env.VUE_APP_SIGNIN_PERMISSIONS.split( "," )
                .map( permission => permission.trim() )
                .filter( permission => !!permission );

            if ( !signinPermissions.length ) signinPermissions = null;
        }

        var res = await this.$api.call( "session/signin", credentials, signinPermissions );

        ctx.commit( "_setSession", res.data );

        return res;
    }

    async ACTION_signout ( ctx ) {

        // signout
        await this.$api.call( "session/signout" );

        // drop API token
        window.localStorage.removeItem( TOKEN_KEY );

        // set token and disconnect
        this.$api.setToken( null );

        // clear session data
        ctx.commit( "_setSession" );
    }

    async ACTION_setPassword ( ctx, password ) {
        var res = await this.$api.call( "profile/set-password", password );

        return res;
    }

    async ACTION_signup ( ctx, data ) {
        var res = await this.$api.call( "session/signup", data );

        return res;
    }

    async ACTION_sendPasswordResetEmail ( ctx, username ) {
        var res = await this.$api.call( "session/send-password-reset-email", username );

        return res;
    }

    async ACTION_confirmEmailByToken ( ctx, token ) {
        var res = await this.$api.call( "session/confirm-email-by-token", token );

        return res;
    }

    async ACTION_setPasswordByToken ( ctx, args ) {
        var res = await this.$api.call( "session/set-password-by-token", ...args );

        return res;
    }
}
