<template>
    <div/>
</template>

<script>
export default {
    "data": () => {
        return {
            "pushNotifications": null,
        };
    },

    "computed": {
        sessionIsAuthenticated () {
            return this.$store.getters["session/isAuthenticated"];
        },
    },

    mounted () {
        if ( window.cordova ) {
            document.addEventListener( "deviceready", this._onCordovaDeviceReady.bind( this ), false );
        }
        else {
            this.createViewport();
        }
    },

    "methods": {
        _onCordovaDeviceReady () {
            this.registerPushNotifications();

            this.onCordovaDeviceReady();

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

        // CORDOVA TEMPLATES
        registerPushNotifications () {
            const me = this;

            // push notification plugin is not present
            if ( !window.PushNotification ) return;

            this.pushNotifications = window.PushNotification.init( {
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

            this.pushNotifications.on( "registration", function ( data ) {
                // var oldRegId = localStorage.getItem('registrationId');

                // if (oldRegId !== data.registrationId) {

                // save new registration ID
                // localStorage.setItem('registrationId', data.registrationId);

                // Post registrationId to your app server as the value has changed
                // }

                // unsubscribe from the topic
                me.pushNotifications.unsubscribe( "all", function () {
                    // subscribe to the topic
                    me.pushNotifications.subscribe( "all",
                        function () {
                            // subscribed
                        },
                        function ( error ) {
                            // subscription error
                            alert( "push error: " + error );
                        } );
                } );
            } );

            this.pushNotifications.on( "error", function ( e ) {
                alert( "push error: " + e.message );
            } );

            this.pushNotifications.on( "notification", function ( data ) {
                me.onPushNotification( data );

                // navigator.notification.alert(
                // data.message, // message
                // null, // callback
                // data.title, // title
                // 'Ok' // buttonName
                // );
            } );
        },

        onCordovaDeviceReady () {},

        onPushNotification ( data ) {},
    },
};
</script>
