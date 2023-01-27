import { Main as Super } from "@softvisio/webpack/configs/main";

export class Main extends Super {

    // properties
    get resolveAlias () {
        return {
            ...super.resolveAlias,
            "vue$": "vue/dist/vue.runtime.esm-bundler.js",
            "#vue": "@softvisio/vue",
        };
    }
}
