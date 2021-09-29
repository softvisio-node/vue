module.exports = function ( api ) {
    return {
        "presets": [
            ["@babel/preset-env", { "shippedProposals": true }],
            ["@vue/app", { "decoratorsLegacy": false, "decoratorsBeforeExport": true }],
        ],
    };
};
