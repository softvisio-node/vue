<template>
    <div/>
</template>

<script>
export default {
    "data": () => {
        return {
            "pushNotification": null,
        };
    },

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
            while ( 1 ) {
                var res = await this.$store.dispatch( "session/signin" );

                if ( res.isSuccess() ) break;

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
            this.$global.$emit( "deviceReady" );
        },

        onDeviceUnload ( e ) {
            // NOTE return true to prevent app unload
            // e.returnValue = true;
        },

        onDevicePause () {
            this.$global.$emit( "devicePause" );
        },

        onDeviceResume () {
            this.$global.$emit( "deviceResume" );
        },

        onDeviceBackButton () {
            this.$global.$emit( "deviceBackButton" );
        },

        onDeviceMenuButton () {
            this.$global.$emit( "deviceMenuButton" );
        },

        onDeviceSearchButton () {
            this.$global.$emit( "deviceSearchButton" );
        },

        onDeviceStartCallButton () {
            this.$global.$emit( "deviceStartCallButton" );
        },

        onDeviceEndCallButton () {
            this.$global.$emit( "deviceEndCallButton" );
        },

        onDeviceVolumeDownButton () {
            this.$global.$emit( "deviceVolumeDownButton" );
        },

        onDeviceVolumeUpButton () {
            this.$global.$emit( "deviceVolumeUpButton" );
        },

        onDeviceActivated () {
            this.$global.$emit( "deviceActivated" );
        },

        // PUSH NOTIFICATIONS
        registerPushNotification () {
            // push notification plugin is not present
            if ( !window.PushNotification ) return;

            this.pushNotification = window.PushNotification.init( {
                "android": {
                    "sound": true,
                    "vibration": true,
                    "forceShow": true, // show notification, if app is in foreground mode
                    // topics: ['all-devel'],
                },
                "ios": {
                    "fcmSandbox": false, // set to true, if app is signed with the development certificate
                    "alert": true,
                    "sound": true,
                    "badge": true,
                },
                "browser": {},
                "windows": {},
            } );

            this.pushNotification.on( "registration", this.onPushNotificationRegistration.bind( this ) );

            this.pushNotification.on( "error", this.onPushNotificationError.bind( this ) );

            this.pushNotification.on( "notification", this.onPushNotification.bind( this ) );
        },

        async pushNotificationUnsubscribe ( topic ) {
            var me = this;

            return new Promise( ( ready ) => {
                me.pushNotifications.unsubscribe( topic, ready );
            } );
        },

        async pushNotificationSubscribe ( topic ) {
            var me = this;

            return new Promise( ( resolve, reject ) => {
                me.pushNotification.subscribe( topic, resolve, reject );
            } );
        },

        async onPushNotificationRegistration ( data ) {
            // var oldRegId = localStorage.getItem('registrationId');
            // if (oldRegId !== data.registrationId) {
            // save new registration ID
            // localStorage.setItem('registrationId', data.registrationId);
            // Post registrationId to your app server as the value has changed
            // }

            // unsubscribe from the topic
            await this.pushNotificationUnsubscribe( "all" );

            // subscribe
            await this.pushNotificationSubscribe( "all" )
                .then( () => {
                    // subscribed
                } )
                .catch( ( e ) => {
                    // error
                    alert( `Push notification error: ${e}` );
                } );
        },

        onPushNotificationError ( e ) {
            alert( `Push notification error: ${e.message}` );
        },

        onPushNotification ( data ) {},
    },
};
</script>
