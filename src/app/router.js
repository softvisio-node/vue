export default class Router {
    #app;
    #path;
    #searchParams;

    constructor ( app ) {
        this.#app = app;

        // window.onhashchange = this.reload.bind( this );

        try {
            const url = new URL( window.location.hash.substring( 1 ), "http://local/" );

            this.#path = url.pathname;
            this.#searchParams = url.searchParams;
        }
        catch ( e ) {
            this.#path = "/";
            this.#searchParams = new URLSearchParams();

            this.reload( "/" );
        }
    }

    // properties
    get app () {
        return this.#app;
    }

    get path () {
        return this.#path;
    }

    get searchParams () {
        return this.#searchParams;
    }

    // public
    async reload ( url, { replace, silent } = {} ) {
        const baseUrl = new URL( "http://local/" );

        baseUrl.pathname = this.#path;
        baseUrl.search = this.#searchParams;

        url = new URL( url, baseUrl );

        const hash = url.pathname + url.search;

        this.#setHash( hash, { replace, silent } );

        await this.#app.reload();
    }

    // private
    #setHash ( hash, { replace, silent } = {} ) {
        if ( hash.charAt( 0 ) !== "#" ) hash = "#" + hash;

        if ( replace ) {
            if ( silent && window.history.replaceState ) {
                window.history.replaceState( null, null, hash );
            }
            else {
                window.location.replace( hash );
            }
        }
        else {
            if ( silent && window.history.pushState ) {
                window.history.pushState( null, null, hash );
            }
            else {
                window.location.hash = hash;
            }
        }
    }
}
