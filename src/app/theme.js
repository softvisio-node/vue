import config from "#vue/config";
import Events from "#core/events";
import { reactive } from "vue";

const DARK_MODE_KEY = "darkMode";
const DEVICE_DARK_MODE_KEY = "deviceDarkMode";
const THEME_KEY = "theme";
const DEFAULT_THEME = {
    "base": config.theme.baseColor,
    "accent": config.theme.accentColor,
};

export default class Theme {
    #app;
    #events = new Events( { "maxListeners": Infinity } );
    #reactive = reactive( {
        "deviceDarkMode": null,
        "darkMode": null,
        "theme": null,
    } );

    constructor ( app ) {
        this.#app = app;

        // listen for device dark mode change
        window.matchMedia( "(prefers-color-scheme: dark)" ).addEventListener( "change", e => {
            if ( !this.#reactive.deviceDarkMode ) return;

            this.#setDarkMode( e.matches );
        } );

        // darkMode
        this.#reactive.deviceDarkMode = window.localStorage.getItem( DEVICE_DARK_MODE_KEY );
        this.#reactive.darkMode = window.localStorage.getItem( DARK_MODE_KEY );

        // device dark mode is not set
        if ( this.#reactive.deviceDarkMode == null ) {

            // user-defined dark mode is set
            if ( this.#reactive.darkMode != null ) {
                this.#reactive.deviceDarkMode = false;
            }

            // user-defined dark mode is not set
            else {

                // follow device dark mode
                if ( config.theme.darkMode === "auto" ) {
                    this.#reactive.deviceDarkMode = true;
                }

                // use user-defined dark mode
                else {
                    this.vdeviceDarkMode = false;
                }
            }
        }
        else {
            this.#reactive.deviceDarkMode = !!JSON.parse( this.#reactive.deviceDarkMode );
        }

        // follow device dark mode settings
        if ( this.#reactive.deviceDarkMode ) {
            this.#reactive.darkMode = this.#getDeviceDarkMode();
        }

        // user-defined dark mode is not set
        else if ( this.#reactive.darkMode == null ) {
            if ( config.theme.darkMode === "auto" ) {
                this.#reactive.darkMode = this.#getDeviceDarkMode();
            }
            else {
                this.#reactive.darkMode = !!config.theme.darkMode;
            }
        }
        else {
            this.#reactive.darkMode = !!JSON.parse( this.#reactive.darkMode );
        }

        // theme
        this.#reactive.theme = window.localStorage.getItem( THEME_KEY );

        if ( this.#reactive.theme == null ) {
            this.#reactive.theme = DEFAULT_THEME;
        }
        else {
            this.#reactive.theme = { ...DEFAULT_THEME, ...JSON.parse( this.#reactive.theme ) };
        }
    }

    // properties
    get app () {
        return this.#app;
    }

    get deviceDarkMode () {
        return this.#reactive.deviceDarkMode;
    }

    set deviceDarkMode ( deviceDarkMode ) {
        this.#setDeviceDarkMode( deviceDarkMode );

        this.#setDarkMode( this.#getDeviceDarkMode() );
    }

    get darkMode () {
        return this.#reactive.darkMode;
    }

    set darkMode ( darkMode ) {
        darkMode = !!darkMode;

        if ( darkMode === this.#reactive.darkMode ) return;

        // turn off device dark mode
        this.#setDeviceDarkMode( false );

        this.#setDarkMode( darkMode );
    }

    get theme () {
        return this.#reactive.theme;
    }

    set theme ( { base, accent } = {} ) {
        base ||= this.#reactive.theme.base;
        accent ||= this.#reactive.theme.accent;

        // not changed
        if ( base === this.#reactive.theme.base && accent === this.#reactive.theme.accent ) return;

        this.#reactive.theme.base = base;
        this.#reactive.theme.accent = accent;

        window.localStorage.setItem( THEME_KEY, JSON.stringify( this.#reactive.theme ) );

        this.#events.emit( "themeChange", this.#reactive.theme );
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
        if ( deviceDarkMode === this.#reactive.deviceDarkMode ) return;

        window.localStorage.setItem( DEVICE_DARK_MODE_KEY, deviceDarkMode );

        this.#reactive.deviceDarkMode = deviceDarkMode;
    }

    #setDarkMode ( darkMode ) {
        darkMode = !!darkMode;

        // not changed
        if ( darkMode === this.#reactive.darkMode ) return;

        window.localStorage.setItem( DARK_MODE_KEY, darkMode );

        this.#reactive.darkMode = darkMode;

        this.#events.emit( "darkModeChange", this.#reactive.darkMode );
    }
}
