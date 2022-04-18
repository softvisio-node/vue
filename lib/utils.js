export * from "#core/utils";

export function copyToClipboard ( str ) {
    const el = document.createElement( "textarea" );

    el.value = str;

    document.body.appendChild( el );

    el.select();
    document.execCommand( "copy" );

    document.body.removeChild( el );
}

export function saveAs ( { filename, url, type, content } = {} ) {
    if ( !url ) url = "data:" + type + "," + encodeURIComponent( content );

    const el = document.createElement( "a" );

    el.setAttribute( "href", url );
    el.setAttribute( "download", filename );

    el.style.display = "none";
    document.body.appendChild( el );

    el.click();

    document.body.removeChild( el );
}
