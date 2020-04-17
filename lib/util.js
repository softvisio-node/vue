export function copyToClipboard ( str ) {
    const el = document.createElement( "textarea" );

    el.value = str;

    document.body.appendChild( el );

    el.select();
    document.execCommand( "copy" );

    document.body.removeChild( el );
}

export function downloadFile ( filename, mime, data ) {
    const el = document.createElement( "a" );

    el.setAttribute( "href", "data:" + mime + "," + encodeURIComponent( data ) );
    el.setAttribute( "download", filename );

    el.style.display = "none";
    document.body.appendChild( el );

    el.click();

    document.body.removeChild( el );
}
