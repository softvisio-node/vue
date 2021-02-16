import { createVNode, render } from "vue";

const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";

function isESModule ( obj ) {
    return obj.__esModule || ( hasSymbol && obj[Symbol.toStringTag] === "Module" );
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
        app.config.globalProperties.$mount = async function ( component, { el, props, children } = {} ) {

            // vue3 function component
            if ( typeof component === "function" ) {
                component = await component();

                if ( isESModule( component ) ) component = component.default;
            }

            // vue3 async component
            else if ( component.name === "AsyncComponentWrapper" ) {
                component = await component.__asyncLoader();
            }

            // create vnode
            const vnode = createVNode( component, props, children );

            // link vnode to the current app context
            if ( app?._context ) vnode.appContext = app._context;

            var container = document.createElement( "div" );

            render( vnode, container );

            vnode.$unmount = function () {
                if ( this.component?.isMounted && !this.component?.isUnmounted ) {
                    this.$unmount = null;

                    // unmount
                    render( null, container );
                }
            };

            // append to the dom
            if ( el && window.Ext && el instanceof Ext.Component ) {
                el.el.dom.appendChild( vnode.el );
            }
            else {
                el ||= this.$.vnode.el;

                el.appendChild( vnode.el );
            }

            const instance = vnode.component.proxy;

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
                                // if ( el instanceof Ext.Container ) el.add( ext );
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
