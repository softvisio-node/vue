module.exports = async function ( content, map, meta ) {
    const callback = this.async(),
        options = this.getOptions();

    if ( this.cacheable ) this.cacheable();

    const locale = new options.Locale( content );

    const value = JSON.stringify( locale.toJSON( true ) )
        .replaceAll( /\u2028/g, "\\u2028" )
        .replaceAll( /\u2029/g, "\\u2029" );

    callback( null, `export default ${value}`, map, meta );
};
