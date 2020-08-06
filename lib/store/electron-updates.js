import Store from "#softvisio/store";

export default class extends Store {
    namespaced = true;

    state () {
        return {
            "updateCheckInterval": 3000, // 1000 * 60 * 10, // 10 minutes
            "updateIsChecking": false,
            "updateReadyToInstall": false,
            "updatePath": null,
            "_checkUpdateCallbacks": null,
        };
    }

    getters () {
        return {
            updateCheckInterval ( state ) {
                return state.updateCheckInterval;
            },

            updateReadyToInstall ( state ) {
                return state.updateReadyToInstall;
            },
        };
    }

    mutations () {
        return {
            checkInterval ( state, interval ) {
                state.checkInterval = interval;
            },

            _updateReadyToInstall ( state, val ) {
                state.updateReadyToInstall = val;
            },
        };
    }

    actions () {
        if ( !window.require ) window.require = function () {};

        const electron = window.require( "electron" );

        if ( !window.cordova || !electron ) return;

        const process = window.require( "process" );

        // TODO only windows currently supported
        if ( !process.platform === "win32" ) return;

        const path = window.require( "path" );
        const childProcess = window.require( "child_process" );
        const fs = window.require( "fs" );
        const fetch = window.require( "node-fetch" );

        const app = electron.app || electron.remote.app;
        const updatesPath = app.getPath( "userData" ) + path.sep + "updates";

        var version;

        // devel mode
        if ( app.getName() === "Electron" ) {
            version = window.require( "../../../package.json" ).version;
        }

        // production mode
        else {
            version = app.getVersion();
        }

        const calcHash = async function ( path ) {
            return new Promise( ( resolve, reject ) => {
                const crypto = window.require( "crypto" ),
                    hash = crypto.createHash( "SHA1" ),
                    stream = fs.ReadStream( path );

                stream.once( "error", e => resolve() );

                stream.on( "data", data => hash.update( data ) );

                stream.once( "end", () => resolve( hash.digest( "hex" ) ) );
            } );
        };

        return {
            async check ( ctx ) {
                return new Promise( resolve => {
                    if ( !ctx.state._checkUpdateCallbacks ) ctx.state._checkUpdateCallbacks = [];

                    ctx.state._checkUpdateCallbacks.push( resolve );

                    ctx.dispatch( "_checkUpdates" );
                } );
            },

            install ( ctx ) {
                if ( !ctx.state.updateReadyToInstall ) return;

                childProcess.spawn( ctx.state.updatePath,
                    [

                        // "/S", // silent
                        "--force-run", // run after install
                    ],
                    {
                        "detached": true,
                        "stdio": "ignore",
                    } );
            },

            async _checkUpdates ( ctx ) {
                if ( ctx.state.updateIsChecking ) return;

                ctx.state.updateIsChecking = true;

                // do check updates request
                const res = await this.$api.call( "electron-updates/check", {
                    "platform": process.platform,
                    "arch": process.arch,
                    version,
                } );

                // updates available
                if ( res.ok && res.data && res.data.download_url ) {

                    // TODO only windows currently supported
                    // TODO if stream name is update.exe - is is removed automatically on stream finish for unknown reasons!!!
                    ctx.state.updatePath = updatesPath + path.sep + "update1.exe";

                    // update is already downloaded
                    if ( fs.existsSync( ctx.state.updatePath ) ) {

                        // update hash is valid
                        if ( res.data.hash === ( await calcHash( ctx.state.updatePath ) ) ) {
                            ctx.commit( "_updateReadyToInstall", true );

                            ctx.dispatch( "_checkUpdateFinished" );

                            return;
                        }

                        // update hash is invalid
                        else {
                            ctx.commit( "_updateReadyToInstall", false );

                            fs.unlinkSync( ctx.state.updatePath );
                        }
                    }

                    // download update
                    if ( !fs.existsSync( updatesPath ) ) fs.mkdirSync( updatesPath, { "recursive": true } );

                    const download = await fetch( res.data.download_url );

                    if ( !download.ok ) return ctx.dispatch( "_checkUpdateFinished" );

                    const stream = fs.createWriteStream( ctx.state.updatePath );

                    download.body.pipe( stream );

                    // download is finished
                    stream.once( "finish", async () => {

                        // hash is valid
                        if ( res.data.hash === ( await calcHash( ctx.state.updatePath ) ) ) {
                            ctx.commit( "_updateReadyToInstall", true );
                        }

                        // hash is invalid
                        else {
                            ctx.commit( "_updateReadyToInstall", false );

                            if ( fs.existsSync( ctx.state.updatePath ) ) fs.unlinkSync( ctx.state.updatePath );
                        }

                        ctx.dispatch( "_checkUpdateFinished" );
                    } );
                }

                // no updates available
                else {
                    ctx.commit( "_updateReadyToInstall", false );

                    // unlink old update
                    if ( ctx.state.updatePath && fs.existsSync( ctx.state.updatePath ) ) {
                        fs.unlinkSync( ctx.state.updatePath );
                    }

                    ctx.dispatch( "_checkUpdateFinished" );
                }
            },

            _checkUpdateFinished ( ctx ) {
                ctx.state.updateIsChecking = false;

                const checkUpdateCallbacks = ctx.state._checkUpdateCallbacks;

                ctx.state._checkUpdateCallbacks = null;

                if ( Array.isArray( checkUpdateCallbacks ) ) {
                    for ( const resolve of checkUpdateCallbacks ) {
                        resolve( ctx.state.updateReadyToInstall );
                    }
                }

                setTimeout( () => {
                    ctx.dispatch( "_checkUpdates" );
                }, ctx.state.updateCheckInterval );
            },
        };
    }
}
