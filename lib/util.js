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

export async function sleep ( timeout ) {
    return new Promise( ( resolve ) => setTimeout( resolve, timeout ) );
}

export async function confirm ( title, message ) {
    return new Promise( ( resolve ) => {
        Ext.Msg.confirm( title || "Confirmation", message || "Are you sure you want to do that?", function ( buttonId ) {
            resolve( buttonId === "yes" ? true : false );
        } );
    } );
}

export function toast ( msg, timeout ) {
    if ( Ext.isObject( msg ) ) {
        if ( msg.reason ) {
            msg = msg.reason;
        }
        else if ( msg.toString ) {
            msg = msg.toString();
        }
    }

    Ext.toast( msg, timeout || 3000 );
}
