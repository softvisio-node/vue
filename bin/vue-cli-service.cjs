#!/usr/bin/env node

// XXX https://github.com/vuejs/vue-cli/issues/6687

const _Service = require( "@vue/cli-service/lib/Service.js" );

class Service extends _Service {
    resolvePlugins ( inlinePlugins, useBuiltIn ) {
        const plugins = super.resolvePlugins( inlinePlugins, useBuiltIn ),
            idx = new Set( plugins.map( plugin => plugin.id ) ),
            pkg = this.pkg;

        this.pkg = require( "../package.json" );
        this.pkg.dependencies = { ...( this.pkg.peerDependencies || {} ), ...( this.pkg.dependencies || {} ) };
        const commonPlugins = super.resolvePlugins();

        this.pkg = pkg;

        for ( const commonPlugin of commonPlugins ) {
            if ( commonPlugin.id.startsWith( "built-in:" ) ) continue;
            if ( idx.has( commonPlugin.id ) ) continue;

            plugins.push( commonPlugin );
        }

        return plugins;
    }
}

module.children[0].exports = Service;

require( "@vue/cli-service/bin/vue-cli-service.js" );
