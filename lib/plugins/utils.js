import * as utils from ":softvisio/utils";

export default {
    install ( app, options ) {
        app.config.globalProperties.$utils = utils;
    },
};
