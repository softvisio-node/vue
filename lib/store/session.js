import Store from "#softvisio/store";
const keyToken = "token";

export default class extends Store {
    namespaced = true;

    state () {
        return {
            "isInitialized": false,
            "isAuthenticated": false,

            // user
            "userId": null,
            "username": null,
            "avatar": null,
            "permissions": null,

            // settings
            "settings": {},
        };
    }

    getters () {
        return {
            isAuthenticated ( state ) {

                // if is not initialized - authentication status is unknown
                return !state.isInitialized ? null : state.isAuthenticated;
            },

            userId ( state ) {
                return state.userId;
            },

            username ( state ) {
                return state.username;
            },

            avatar ( state ) {
                return state.avatar;
            },

            isRoot ( state ) {
                return state.userId === 1;
            },

            "hasPermissions": state => permissions => {

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
            },
        };
    }

    mutations () {
        return {
            _session ( state, data ) {
                if ( data && data.is_authenticated ) {
                    state.isAuthenticated = true;
                    state.userId = data.user_id;
                    state.username = data.username;
                    state.avatar = data.avatar;
                    state.permissions = data.permissions;

                    state.settings = data.settings;

                    if ( data.token ) {

                        // store token
                        window.localStorage.setItem( keyToken, data.token );

                        // use new token
                        this.$api.setToken( data.token );
                    }
                }
                else {
                    state.isAuthenticated = false;
                    state.userId = null;
                    state.username = null;
                    state.avatar = null;
                    state.permissions = null;
                }
            },
        };
    }

    actions () {
        return {
            async signin ( ctx, credentials = null ) {
                var signinPermissions;

                // prepare signin permissions
                if ( process.env.VUE_APP_SIGNIN_PERMISSIONS ) {
                    signinPermissions = process.env.VUE_APP_SIGNIN_PERMISSIONS.split( "," )
                        .map( permission => permission.trim() )
                        .filter( permission => !!permission );

                    if ( !signinPermissions.length ) signinPermissions = null;
                }

                var res = await this.$api.call( "session/signin", credentials, signinPermissions );

                if ( !ctx.state.isInitialized && res.ok ) ctx.state.isInitialized = true;

                ctx.commit( "_session", res.data );

                return res;
            },

            async signout ( ctx ) {

                // signout
                await this.$api.call( "session/signout" );

                // drop API token
                window.localStorage.removeItem( keyToken );

                // set token and disconnect
                this.$api.setToken( null );

                // clear session data
                ctx.commit( "_session" );
            },

            async changePassword ( ctx, password ) {
                var res = await this.$api.call( "profile/set-password", password );

                return res;
            },

            async signup ( ctx, data ) {
                var res = await this.$api.call( "session/signup", data );

                return res;
            },

            async sendPasswordResetEmail ( ctx, username ) {
                var res = await this.$api.call( "session/send-password-reset-email", username );

                return res;
            },

            async confirmEmailByToken ( ctx, token ) {
                var res = await this.$api.call( "session/confirm-email-by-token", token );

                return res;
            },

            async setPasswordByToken ( ctx, args ) {
                var res = await this.$api.call( "session/set-password-by-token", ...args );

                return res;
            },
        };
    }
}
