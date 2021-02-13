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
        app.config.globalProperties.$mount = function ( component, { props, children, element } = {} ) {

            // create vNode
            const vNode = createVNode( component, props, children );

            // link vnode to the current app context
            if ( app?._context ) vNode.appContext = app._context;

            // mount vNode
            element ||= document.createElement( "div" );
            render( vNode, element );

            let isMounted = true;

            vNode.$isMounted = function () {
                return isMounted;
            };

            vNode.$unmount = function () {
                if ( isMounted ) {
                    isMounted = false;
                    this.$unmount = null;

                    // unmount
                    render( null, element );
                }
            };

            return vNode.component.proxy;
        };
    },
};
