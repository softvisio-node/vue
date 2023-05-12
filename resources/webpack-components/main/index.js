import WebpackComponent from "@softvisio/webpack/webpack-components/main";

export default class extends WebpackComponent {

    // properties
    get webpackResolveAlias () {
        return {
            ...super.webpackResolveAlias,
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
        };
    }

    // public
    validateEnv ( env ) {
        return super.validateEnv( env ) || this._validateEnv( env, import.meta.url );
    }
}
