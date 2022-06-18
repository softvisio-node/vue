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

export async function alert ( message, { title } = {} ) {
    if ( title ) message = `${title}\n\n${message}`;

    alert( message );
}

export async function confirm ( message, { title } = {} ) {
    if ( title ) message = `${title}\n\n${message}`;

    return confirm( message );
}

export function toast ( msg, timeout ) {
    if ( Ext.isObject( msg ) ) msg = msg.statusText ?? msg + "";

    console.log( msg );
}
