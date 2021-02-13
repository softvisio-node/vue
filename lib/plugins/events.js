import Events from "@softvisio/core/events";

export default {
    install ( app, options ) {
        const events = new Events();

        app.config.globalProperties.$global = events;
    },
};
