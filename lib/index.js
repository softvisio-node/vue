import { createApp, createVNode, render } from "vue";
import Api from "@softvisio/core/api";
import Store from "./store";
import MainStore from "@/store";
import Viewport from "@/viewport.vue";
import * as util from "#softvisio/util";
import EventEmitter from "@softvisio/core/events";

export default function () {
    const app = createApp( Viewport );

    app.config.globalProperties.$destroy = function () {
        if ( this.$.vnode.$destroy ) this.$.vnode.$destroy();
    };

    app.config.globalProperties.$isDestroyed = function () {
        return this.$.vnode.$isDestroyed;
    };

    app.config.globalProperties.$setOnDestroy = function ( onDestroy ) {
        if ( this.$isDestroyed() || !this.$.vnode.$destroy ) return;

        if ( typeof onDestroy !== "function" ) onDestroy = null;

        this.$.vnode.onDestroy = onDestroy;
    };

    /*
     * mount(component, { props, children, element })
     * component: required, the component to be created/mounted
     * props: props to be passed onto the component, this can include HTML attributes like id or class
     * children: components to be rendered as children of component
     * element: if specified, the element to mount the component into, if not specified, a div will be created
     * onDestroy: function, called when component destroyed
     *
     * Set component.$.vnode.$destroy().
     *
     * returns { vNode, destroy, el }
     * instance: the instance of the component provided
     */
    app.config.globalProperties.$mountComponent = function ( component, { props, children, element, onDestroy } = {} ) {
        let el = element;

        let vNode = createVNode( component, props, children );

        if ( app?._context ) vNode.appContext = app._context;

        if ( el ) render( vNode, el );
        else if ( typeof document !== "undefined" ) render( vNode, ( el = document.createElement( "div" ) ) );

        if ( onDestroy ) vNode.$onDestroy = onDestroy;

        vNode.$isDestroyed = false;

        vNode.$destroy = function () {
            if ( el ) {
                render( null, el );

                el = null;
            }

            if ( vNode ) {
                vNode.$destroy = null;
                vNode.$isDestroyed = true;

                const onDestroy = vNode.$onDestroy;
                vNode.$onDestroy = null;

                vNode = null;

                if ( onDestroy ) onDestroy();
            }
        };

        return vNode.component.proxy;
    };

    // global event bus
    app.config.globalProperties.$global = new EventEmitter();
    Store.prototype.$global = app.config.globalProperties.$global;

    // util
    app.config.globalProperties.$util = util;
    Store.prototype.$util = app.config.globalProperties.$util;

    // api
    app.config.globalProperties.$api = new Api( process.env.VUE_APP_API_URL, {
        "token": window.localStorage.getItem( "token" ),
    } );
    Store.prototype.$api = app.config.globalProperties.$api;

    // store
    app.config.globalProperties.$store = Store.new( MainStore );

    return app;
}
