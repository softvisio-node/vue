<template>
    <div/>
</template>

<script>
import "./assets/scrollbars.css";
import defaultMask from "./load-mask";
import RecoverPasswordDialog from "./components/recover-password-dialog";
import AppInitFailureDialog from "./components/app-init-failure-dialog";

export default {
    "data": () => {
        return {
            "appInitFailureDialog": AppInitFailureDialog,
            "recoverPasswordDialog": RecoverPasswordDialog,
            "defaultMask": defaultMask,
            "privateView": null,
            "publicView": null,

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

        async createViewport () {
            Ext.application( {
                "name": "app",
                "launch": this.ready.bind( this ),
            } );
        },

        async ready () {
            var viewport = Ext.Viewport;

            while ( 1 ) {
                viewport.mask( this.defaultMask );

                var res = await this.$store.dispatch( "session/signin" );

                viewport.unmask();

                if ( res.isSuccess() ) break;

                const dialog = await Ext.Viewport.addVue( this.appInitFailureDialog );

                await new Promise( ( resolve ) => {
                    dialog.$once( "hook:beforeDestroy", resolve );
                } );
            }

            this.$router.init( this );

            this.$router.reload();

            this.$watch( "sessionIsAuthenticated", this.onAuthChange.bind( this ) );
        },

        onAuthChange () {
            this.$router.reload();
        },

        async onRoute ( route ) {
            if ( route.get() === "recover-password" ) {
                this.routeRecoverPasword();
            }
            else if ( route === "confirm-email" ) {
                this.routeConfirmEmail();
            }
            else {
                if ( this.sessionIsAuthenticated ) {
                    this.routePrivate( route );
                }
                else {
                    this.routePublic( route );
                }
            }
        },

        async routeRecoverPasword () {
            Ext.Viewport.addVue( this.recoverPasswordDialog );
        },

        // TODO
        async routeConfirmEmail () {},

        async routePublic ( route ) {
            if ( !this.publicView ) return;

            if ( this.currentView !== "public" ) {
                this.currentView = "public";

                if ( this.view ) this.view.$destroy();

                this.view = await Ext.Viewport.addVue( this.publicView );
            }

            route.forward( this.view );
        },

        async routePrivate ( route ) {
            if ( !this.privateView ) return;

            if ( this.currentView !== "private" ) {
                this.currentView = "private";

                if ( this.view ) this.view.$destroy();

                this.view = await Ext.Viewport.addVue( this.privateView );
            }

            route.forward( this.view );
        },

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
