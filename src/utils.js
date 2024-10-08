export * from "#core/utils";

export function copyToClipboard ( str ) {
    const el = document.createElement( "textarea" );

    el.value = str;

    document.body.append( el );

    el.select();
    document.execCommand( "copy" );

    el.remove();
}

export function clickUrl ( url ) {
    if ( typeof url === "string" ) url = new URL( url );

    const el = document.createElement( "a" );

    el.setAttribute( "target", "_blank" );
    el.setAttribute( "href", url.href );

    el.style.display = "none";
    document.body.append( el );

    el.click();

    el.remove();
}

export function saveAs ( url ) {
    var name, type, content;

    if ( typeof url === "string" ) url = new URL( url );

    if ( url instanceof URL ) {
        if ( url.protocol === "data:" ) {
            if ( url.search ) {
                url = new URL( url );

                name = url.searchParams.get( "name" );

                url.search = "";
            }
        }
    }
    else {
        ( { url, name, type, content } = url );

        url ||= "data:" + type + "," + encodeURIComponent( content );
    }

    const el = document.createElement( "a" );

    el.setAttribute( "target", "_blank" );
    el.setAttribute( "download", name );
    el.setAttribute( "href", url );

    el.style.display = "none";
    document.body.append( el );

    el.click();

    el.remove();
}

export async function alert ( message, { title } = {} ) {
    if ( title ) message = `${ title }\n\n${ message }`;

    alert( message );
}

export async function confirm ( message, { title } = {} ) {
    if ( title ) message = `${ title }\n\n${ message }`;

    return confirm( message );
}

export function toast ( msg, timeout ) {
    if ( Ext.isObject( msg ) ) msg = msg.statusText ?? msg + "";

    console.log( msg );
}

export function labelError ( text ) {
    return `<span style="background-color:red;color:white">&nbsp;${ text }&nbsp;</span>`;
}
