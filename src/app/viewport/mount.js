import { createVNode as createVnode, render } from "vue";

const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";

const COMPONENTS_CACHE = new Map();

function isEsModule ( obj ) {
    return obj.__esModule || ( hasSymbol && obj[ Symbol.toStringTag ] === "Module" );
}

export default {
    install ( app, options ) {
        app.config.globalProperties.$unmount = function () {
            if ( this.$.vnode.$unmount ) this.$.vnode.$unmount();
        };

        app.config.globalProperties.$isMounted = function () {
            return this.$.vnode.component?.isMounted && !this.$.vnode.component?.isUnmounted;
        };

        app.config.globalProperties.$isUnmounted = function () {
            return this.$.vnode.component?.isMounted && this.$.vnode.component?.isUnmounted;
        };

        /*
         * mount(component, { props, children, el })
         * component: required, the component to be created/mounted
         * props: props to be passed onto the component, this can include HTML attributes like id or class
         * children: components to be rendered as children of component
         * el: if specified, the element to mount the component into, if not specified, a div will be created
         * cache: cache component instance internally
         *
         * returns vue component instance
         * instance: the instance of the component provided
         */
        app.config.globalProperties.$mount = async function ( component, { el, props, children, cache } = {} ) {

            // vue3 function component
            if ( typeof component === "function" ) {
                component = await component();

                if ( isEsModule( component ) ) component = component.default;
            }
            else if ( component instanceof Promise ) {
                component = await component;

                if ( isEsModule( component ) ) component = component.default;
            }

            // vue3 async component
            else if ( component.name === "AsyncComponentWrapper" ) {
                component = await component.__asyncLoader();
            }

            // check cache key
            if ( cache ) {
                const cachedComponent = COMPONENTS_CACHE.get( component )?.get( cache );

                if ( cachedComponent ) return cachedComponent;
            }

            // create vnode
            const vnode = createVnode( component, props, children );

            // link vnode to the current app context
            if ( app?._context ) vnode.appContext = app._context;

            var container = document.createElement( "div" );

            render( vnode, container );

            vnode.$unmount = function () {
                if ( this.component?.isMounted && !this.component?.isUnmounted ) {
                    this.$unmount = null;

                    // unmount
                    render( null, { "_vnode": this } );

                    // remove component from cache, if was cached
                    if ( cache ) {
                        COMPONENTS_CACHE.get( component )?.delete( cache );

                        if ( !COMPONENTS_CACHE.get( component )?.size ) {
                            COMPONENTS_CACHE.delete( component );
                        }
                    }
                }
            };

            // define target element
            if ( !el ) {

                // mount floated ext dialogs to Ext.Viewport by default
                if ( vnode.el.tagName === "EXT-DIALOG" ) {
                    if ( vnode.el.getAttribute( "floated" ) !== "false" ) el = Ext.Viewport;
                }

                el ||= this.$.vnode.el;
            }

            // append to the dom
            if ( window.Ext && el instanceof Ext.Component ) {
                el.el.dom.append( vnode.el );
            }
            else {
                el.append( vnode.el );
            }

            const instance = vnode.component.proxy;

            // cache component instance
            if ( cache ) {
                if ( !COMPONENTS_CACHE.has( component ) ) {
                    COMPONENTS_CACHE.set( component, new Map() );
                }

                COMPONENTS_CACHE.get( component ).set( cache, instance );
            }

            if ( vnode.el.tagName.substring( 0, 4 ) === "EXT-" ) {
                return new Promise( resolve => {
                    vnode.el.addEventListener(
                        "ready",
                        e => {
                            const ext = e.detail.cmp;

                            // ext is destoryed
                            if ( ext.destroyed ) {
                                instance.$unmount();
                            }
                            else {
                                instance.ext = ext;

                                // destroy instance on ext destroyed
                                ext.on( "destroy", () => instance.$unmount(), null, { "single": true } );

                                // add ext to the current container
                                // XXX
                                // if ( el instanceof Ext.Container ) el.add( ext );
                            }

                            resolve( instance );
                        },
                        { "once": true }
                    );
                } );
            }
            else {
                return instance;
            }
        };
    },
};
