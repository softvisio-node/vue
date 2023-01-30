import WebpackComponent from "@softvisio/webpack/webpack-components/main";

export default class extends WebpackComponent {

    // properties
    get resolveAlias () {
        return {
            ...super.resolveAlias,
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
        };
    }
}
