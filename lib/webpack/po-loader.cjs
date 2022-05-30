module.exports = async function ( content, map, meta ) {
    const callback = this.async();

    if ( this.cacheable ) this.cacheable();

    // const options = this.getOptions();

    const value = JSON.stringify( {
        "Create User": ["Создать пользователя"],
    } )
        .replaceAll( /\u2028/g, "\\u2028" )
        .replaceAll( /\u2029/g, "\\u2029" );

    callback( null, `export default ${value}`, map, meta );
};
