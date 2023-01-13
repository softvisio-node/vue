module.exports = async function ( buffer, map, meta ) {
    const callback = this.async(),
        options = this.getOptions();

    if ( this.cacheable ) this.cacheable();

    const locale = new options.PoFile( buffer ).locale;

    const value = JSON.stringify( locale )
        .replaceAll( /\u2028/g, "\\u2028" )
        .replaceAll( /\u2029/g, "\\u2029" );

    callback( null, `export default ${value}`, map, meta );
};
