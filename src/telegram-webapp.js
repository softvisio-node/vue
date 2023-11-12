var loaded = false;

export default async function () {
    if ( loaded ) return;

    loaded = true;

    const script = document.createElement( "SCRIPT" );
    script.setAttribute( "src", "https://telegram.org/js/telegram-web-app.js" );
    script.setAttribute( "async", "" );
    script.setAttribute( "defer", "" );
    document.body.appendChild( script );

    return new Promise( resolve => {
        script.onload = resolve;
    } );
}
