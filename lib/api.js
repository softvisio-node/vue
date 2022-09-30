import config from "#vue/config";
import Api from "#core/api";

var api;

if ( config.app.apiUrl ) {
    api = Api.new( config.app.apiUrl, {
        "token": window.localStorage.getItem( "apiToken" ),
    } );
}

export default api;
