import * as utils from "#vue/utils";

export default {
    install ( app, options ) {
        app.config.globalProperties.$utils = utils;
    },
};
