import WebpackComponent from "@softvisio/webpack/webpack-components/web";

export default class extends WebpackComponent {

    // properties
    get webpackResolveAlias () {
        return {
            ...super.webpackResolveAlias,
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
            "#app": "@softvisio/vue/app-instance",
        };
    }

    // public
    validateEnv ( env ) {
        const errors = super.validateEnv( env ) || this._validateEnv( env, import.meta.url );

        if ( errors ) return errors;

        if ( env.config.defaultLocale && !env.config.locales.includes( env.config.defaultLocale ) ) {
            return [ "Default locale is not valid" ];
        }

        return errors;
    }
}
