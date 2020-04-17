const keyToken = "token";
const keyDarkMode = "darkMode";
const keyTheme = "theme";

var state = {
    "isInitialized": false,
    "isAuthenticated": false,

    // user
    "userId": null,
    "userName": null,
    "avatar": null,
    "permissions": null,

    // settings
    "settings": {},

    // theme
    "darkMode": false,

    "theme": {
        "accent": null,
        "base": null,
    },
};

var getters = {
    isAuthenticated ( state ) {
        // if is not initialized - authentication status is unknown
        return !state.isInitialized ? null : state.isAuthenticated;
    },

    userId ( state ) {
        return state.userId;
    },

    userName ( state ) {
        return state.userName;
    },

    avatar ( state ) {
        return state.avatar;
    },

    darkMode ( state ) {
        return state.darkMode;
    },

    isRoot ( state ) {
        return state.userId === 1;
    },

    "hasPermissions": ( state ) => ( permissions ) => {
        // no permissions, authorization is not required
        if ( !permissions ) return true;

        if ( !Ext.isArray( permissions ) ) permissions = [permissions];

        // no permissions, authorization is not required
        if ( !permissions.length ) return true;

        if ( !state.isAuthenticated ) return false;

        var userPermissions = state.permissions || {};

        // compare permissions for authenticated session only
        for ( const permission of permissions ) {
            // any authenticated user
            if ( permission === "*" ) return true;

            if ( userPermissions[permission] ) return true;
        }

        return false;
    },
};

var mutations = {
    invertDarkMode ( state ) {
        this.commit( "session/darkMode", !state.darkMode );
    },

    darkMode ( state, darkMode ) {
        state.darkMode = darkMode;

        window.localStorage.setItem( keyDarkMode, darkMode );

        this.commit( "session/_applyTheme" );
    },

    theme ( state, theme ) {
        state.theme = { ...state.theme, ...theme };

        window.localStorage.setItem( keyTheme, JSON.stringify( state.theme ) );

        this.commit( "session/_applyTheme" );
    },

    _applyTheme ( state ) {
        if ( Ext ) {
            Ext.manifest.material = Ext.manifest.material || {};
            Ext.manifest.material.toolbar = Ext.manifest.material.toolbar || {};
            Ext.manifest.material.toolbar.dynamic = true;

            const theme = { ...state.theme, "darkMode": state.darkMode };

            Ext.theme.Material.setColors( theme );
        }
    },

    _session ( state, data ) {
        if ( data && data.is_authenticated ) {
            state.isAuthenticated = true;
            state.userId = data.user_id;
            state.userName = data.user_name;
            state.avatar = data.avatar;
            state.permissions = data.permissions;

            state.settings = data.settings;

            if ( data.token ) {
                // store token
                window.localStorage.setItem( keyToken, data.token );

                // use new token
                this._vm.$api.auth( data.token );
            }
        }
        else {
            state.isAuthenticated = false;
            state.userId = null;
            state.userName = null;
            state.avatar = null;
            state.permissions = null;
        }
    },
};

var actions = {
    init ( ctx ) {
        // api
        var token = window.localStorage.getItem( keyToken );

        this._vm.$api.auth( token );

        // darkMode
        var darkMode = window.localStorage.getItem( keyDarkMode );

        // darkMode wasn't stored in localstorage
        if ( darkMode == null ) {
            // apply default dark mode
            ctx.state.darkMode = !!+process.env.VUE_APP_THEME_DARK_MODE || process.env.VUE_APP_THEME_DARK_MODE === "true" ? true : false;
        }
        else {
            ctx.state.darkMode = JSON.parse( darkMode );
        }

        // theme
        var theme = window.localStorage.getItem( keyTheme );

        var defaultTheme = {
            "base": process.env.VUE_APP_THEME_BASE,
            "accent": process.env.VUE_APP_THEME_ACCENT,
        };

        if ( theme == null ) {
            ctx.state.theme = defaultTheme;
        }
        else {
            ctx.state.theme = { ...defaultTheme, ...JSON.parse( theme ) };
        }

        ctx.commit( "_applyTheme" );
    },

    async signin ( ctx, credintials ) {
        var res = await this._vm.$api.call( "session/signin", credintials );

        if ( !ctx.state.isInitialized && res.isSuccess() ) ctx.state.isInitialized = true;

        ctx.commit( "_session", res.data );

        return res;
    },

    async signout ( ctx ) {
        // signout
        await this._vm.$api.call( "session/signout" );

        // drop API token
        window.localStorage.removeItem( keyToken );

        // set token and disconnect
        this._vm.$api.auth( null );

        // clear session data
        ctx.commit( "_session" );
    },

    async changePassword ( ctx, password ) {
        var res = await this._vm.$api.call( "profile/change-password", password );

        return res;
    },

    async signup ( ctx, data ) {
        var res = await this._vm.$api.call( "session/signup", data );

        return res;
    },

    async recoverPassword ( ctx, username ) {
        var res = await this._vm.$api.call( "session/recover-password", username );

        return res;
    },

    async setPassword ( ctx, args ) {
        var res = await this._vm.$api.call( "session/set-password", ...args );

        return res;
    },
};

export default {
    "namespaced": true,
    state,
    getters,
    mutations,
    actions,
};
