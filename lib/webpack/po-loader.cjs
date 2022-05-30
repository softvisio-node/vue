module.exports = async function ( content, map, meta ) {
    const callback = this.async();

    // const Gettext = await import( "#core/localization/gettext" );

    if ( this.cacheable ) this.cacheable();

    const value = JSON.stringify( {
        "Create User": ["Создать пользователя"],
    } )
        .replaceAll( /\u2028/g, "\\u2028" )
        .replaceAll( /\u2029/g, "\\u2029" );

    callback( null, `export default ${value}`, map, meta );
};
