import Events from "#core/events";

export default {
    install ( app, options ) {
        const events = new Events();

        app.config.globalProperties.$events = events;
    },
};
