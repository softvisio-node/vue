<template>
    <div/>
</template>

<script>
export default {
    "computed": {
        sessionIsAuthenticated () {
            return this.$store.getters["session/isAuthenticated"];
        },
    },

    mounted () {
        if ( window.cordova ) {
            document.addEventListener( "deviceready", this._onDeviceReady.bind( this ), false );
        }
        else {
            this.createViewport();
        }
    },

    "methods": {
        _onDeviceReady () {

            // register cordova events, https://cordova.apache.org/docs/en/latest/cordova/events/events.html
            document.addEventListener( "pause", this.onDevicePause.bind( this ), false );
            document.addEventListener( "resume", this.onDeviceResume.bind( this ), false );
            document.addEventListener( "backbutton", this.onDeviceBackButton.bind( this ), false );
            document.addEventListener( "menubutton", this.onDeviceMenuButton.bind( this ), false );
            document.addEventListener( "searchbutton", this.onDeviceSearchButton.bind( this ), false );
            document.addEventListener( "startcallbutton", this.onDeviceStartCallButton.bind( this ), false );
            document.addEventListener( "endcallbutton", this.onDeviceEndCallButton.bind( this ), false );
            document.addEventListener( "volumedownbutton", this.onDeviceVolumeDownButton.bind( this ), false );
            document.addEventListener( "volumeupbutton", this.onDeviceVolumeUpButton.bind( this ), false );
            document.addEventListener( "activated", this.onDeviceActivated.bind( this ), false );

            window.onbeforeunload = this.onDeviceUnload.bind( this );

            this.registerPushNotification();

            this.onDeviceReady();

            this.createViewport();
        },

        createViewport () {
            this.ready();
        },

        async ready () {

            // init session
            while ( 1 ) {
                var res = await this.$store.dispatch( "session/signin" );

                // connection ok
                if ( res.ok || res.status === 401 || res.status === 403 ) break;

                // connection error
                await this.onAppInitFailure();
            }

            this.$watch( "sessionIsAuthenticated", this.onAuthChange.bind( this ) );
        },

        async onAppInitFailure () {
            alert( `Server connection error. Press "OK" to try again.` );
        },

        onAuthChange () {},

        // DEVICE HOOKS
        onDeviceReady () {
            this.$global.$emit( "device-ready" );
        },

        onDeviceUnload ( e ) {

            // NOTE return true to prevent app unload
            // e.returnValue = true;
        },

        onDevicePause () {
            this.$global.$emit( "device-pause" );
        },

        onDeviceResume () {
            this.$global.$emit( "device-resume" );
        },

        onDeviceBackButton () {
            this.$global.$emit( "device-back-button" );
        },

        onDeviceMenuButton () {
            this.$global.$emit( "device-menu-button" );
        },

        onDeviceSearchButton () {
            this.$global.$emit( "device-search-button" );
        },

        onDeviceStartCallButton () {
            this.$global.$emit( "device-start-call-button" );
        },

        onDeviceEndCallButton () {
            this.$global.$emit( "device-end-call-button" );
        },

        onDeviceVolumeDownButton () {
            this.$global.$emit( "device-volume-down-button" );
        },

        onDeviceVolumeUpButton () {
            this.$global.$emit( "device-volume-up-button" );
        },

        onDeviceActivated () {
            this.$global.$emit( "device-activated" );
        },

        // PUSH NOTIFICATIONS
        registerPushNotification () {

            // FirebasePlugin plugin is not present
            if ( !window.FirebasePlugin ) return;

            const topic = process.env.VUE_APP_PUSH_TOPIC;

            // push topic is not defined
            if ( !topic ) return;

            // subscribe
            window.FirebasePlugin.subscribe( topic,
                () => {},
                error => {
                    console.log( `Unable to subscribe to the push notification topic "${topic}". ${error}` );
                } );

            // set event listener
            window.FirebasePlugin.onMessageReceived( data => {
                this.$global.$emit( "push", data );
            },
            error => {
                console.log( `Push notification error. ${error}` );
            } );
        },
    },
};
</script>
