export default class {
    getStoreConfig () {
        var config = {
            "namespaced": this.namespaced,
            "state": this.state() || {},
            "getters": this.getters() || {},
            "mutations": this.mutations() || {},
            "actions": this.actions() || {},
            "modules": this.modules() || {},
        };

        for ( const module in config.modules ) {
            config.modules[module] = new config.modules[module]().getStoreConfig();
        }

        return config;
    }

    state () {}

    getters () {}

    mutations () {}

    actions () {}

    modules () {}
}
