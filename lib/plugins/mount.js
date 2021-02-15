import { createVNode, render } from "vue";

export default {
    install ( app, options ) {
        app.config.globalProperties.$unmount = function () {
            if ( this.$.vnode.$unmount ) this.$.vnode.$unmount();
        };

        app.config.globalProperties.$isMounted = function () {
            return this.$.vnode.$isMounted ? this.$.vnode.$isMounted() : true;
        };

        /*
         * mount(component, { props, children, element })
         * component: required, the component to be created/mounted
         * props: props to be passed onto the component, this can include HTML attributes like id or class
         * children: components to be rendered as children of component
         * element: if specified, the element to mount the component into, if not specified, a div will be created
         *
         * Set component.$.vnode.$destroy().
         *
         * returns { vNode, destroy, el }
         * instance: the instance of the component provided
         */
        app.config.globalProperties.$mount = async function ( component, el, props, children ) {

            // XXX vue3 function component
            if ( typeof component === "function" ) {
                component = component();
            }

            // vue3 async component
            else if ( component.name === "AsyncComponentWrapper" ) {
                component = await component.__asyncLoader();
            }

            // create vNode
            const vnode = createVNode( component, props, children );

            // link vnode to the current app context
            if ( app?._context ) vnode.appContext = app._context;

            var extComponent;

            if ( el && window.Ext && el instanceof Ext.Component ) {
                extComponent = el;

                el = null;
            }

            el ||= document.createElement( "div" );

            render( vnode, el );

            let isMounted = true;

            vnode.$isMounted = function () {
                return isMounted;
            };

            vnode.$unmount = function () {
                if ( isMounted ) {
                    isMounted = false;
                    this.$unmount = null;

                    // unmount
                    render( null, el );
                }
            };

            const instance = vnode.component.proxy;

            // append to the dom
            // XXX
            if ( extComponent ) extComponent.el.dom.appendChild( instance.$.vnode.el );

            if ( vnode.el.tagName.substring( 0, 4 ) === "EXT-" ) {
                return new Promise( resolve => {
                    vnode.el.addEventListener( "ready",
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
                                if ( extComponent && extComponent instanceof Ext.Container ) extComponent.add( ext );
                            }

                            resolve( instance );
                        },
                        { "once": true } );
                } );
            }
            else {
                return instance;
            }
        };
    },
};
