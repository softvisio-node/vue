import Store from "#vue/store";
import config from "#vue/config";
import Events from "#core/events";

const DARK_MODE_KEY = "darkMode";
const DEVICE_DARK_MODE_KEY = "deviceDarkMode";
const THEME_KEY = "theme";
const DEFAULT_THEME = {
    "base": config.theme.baseColor,
    "accent": config.theme.accentColor,
};

export default class Theme extends Store {

    // state
    _deviceDarkMode;
    _darkMode;
    _theme;

    #app;
    #events = new Events( { "maxListeners": Infinity } );

    constructor ( app ) {
        super();

        this.#app = app;

        // listen for device dark mode change
        window.matchMedia( "(prefers-color-scheme: dark)" ).addEventListener( "change", e => {
            if ( !this._deviceDarkMode ) return;

            this.#setDarkMode( e.matches );
        } );

        // darkMode
        this._deviceDarkMode = window.localStorage.getItem( DEVICE_DARK_MODE_KEY );
        this._darkMode = window.localStorage.getItem( DARK_MODE_KEY );

        // device dark mode is not set
        if ( this._deviceDarkMode == null ) {

            // user-defined dark mode is set
            if ( this._darkMode != null ) {
                this._deviceDarkMode = false;
            }

            // user-defined dark mode is not set
            else {

                // follow device dark mode
                if ( config.theme.darkMode === "auto" ) {
                    this._deviceDarkMode = true;
                }

                // use user-defined dark mode
                else {
                    this._deviceDarkMode = false;
                }
            }
        }
        else {
            this._deviceDarkMode = !!JSON.parse( this._deviceDarkMode );
        }

        // follow device dark mode settings
        if ( this._deviceDarkMode ) {
            this._darkMode = this.#getDeviceDarkMode();
        }

        // user-defined dark mode is not set
        else if ( this._darkMode == null ) {
            if ( config.theme.darkMode === "auto" ) {
                this._darkMode = this.#getDeviceDarkMode();
            }
            else {
                this._darkMode = !!config.theme.darkMode;
            }
        }
        else {
            this._darkMode = !!JSON.parse( this._darkMode );
        }

        // theme
        this._theme = window.localStorage.getItem( THEME_KEY );

        if ( this._theme == null ) {
            this._theme = DEFAULT_THEME;
        }
        else {
            this._theme = { ...DEFAULT_THEME, ...JSON.parse( this._theme ) };
        }
    }

    // properties
    get app () {
        return this.#app;
    }

    get deviceDarkMode () {
        return this._deviceDarkMode;
    }

    set deviceDarkMode ( deviceDarkMode ) {
        this.#setDeviceDarkMode( deviceDarkMode );

        this.#setDarkMode( this.#getDeviceDarkMode() );
    }

    get darkMode () {
        return this._darkMode;
    }

    set darkMode ( darkMode ) {
        darkMode = !!darkMode;

        if ( darkMode === this._darkMode ) return;

        // turn off device dark mode
        this.#setDeviceDarkMode( false );

        this.#setDarkMode( darkMode );
    }

    get theme () {
        return this._theme;
    }

    set theme ( { base, accent } = {} ) {
        base ||= this._theme.base;
        accent ||= this._theme.accent;

        // not changed
        if ( base === this._theme.base && accent === this._theme.accent ) return;

        this._theme.base = base;
        this._theme.accent = accent;

        window.localStorage.setItem( THEME_KEY, JSON.stringify( this._theme ) );

        this.#events.emit( "themeChange", this._theme );
    }

    // public
    on ( name, listener ) {
        this.#events.on( name, listener );

        return this;
    }

    once ( name, listener ) {
        this.#events.once( name, listener );

        return this;
    }

    off ( name, listener ) {
        this.#events.off( name, listener );

        return this;
    }

    // private
    #getDeviceDarkMode () {
        return window.matchMedia && window.matchMedia( "(prefers-color-scheme: dark)" ).matches;
    }

    #setDeviceDarkMode ( deviceDarkMode ) {
        deviceDarkMode = !!deviceDarkMode;

        // not changed
        if ( deviceDarkMode === this._deviceDarkMode ) return;

        window.localStorage.setItem( DEVICE_DARK_MODE_KEY, deviceDarkMode );

        this._deviceDarkMode = deviceDarkMode;
    }

    #setDarkMode ( darkMode ) {
        darkMode = !!darkMode;

        // not changed
        if ( darkMode === this._darkMode ) return;

        window.localStorage.setItem( DARK_MODE_KEY, darkMode );

        this._darkMode = darkMode;

        this.#events.emit( "darkModeChange", this._darkMode );
    }
}
