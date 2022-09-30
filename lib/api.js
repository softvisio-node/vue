import config from "#vue/config";
import Api from "#core/api";

var api;

if ( config.apiUrl ) {
    api = Api.new( config.apiUrl, {
        "token": window.localStorage.getItem( "apiToken" ),
    } );
}

export default api;
