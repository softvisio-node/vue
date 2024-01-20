<template>
    <div/>
</template>

<script>
export default {
    mounted () {
        this._ready();
    },

    "methods": {
        async _ready () {

            // init session
            while ( true ) {
                const res = await this.$app.signIn();

                // connection ok
                if ( res.ok ) break;

                // connection error
                await this.onInitFailure();
            }
        },

        async onInitFailure () {
            alert( `Server connection error. Press "OK" to try again.` );
        },

        mask () {},

        unmask () {},
    },
};
</script>
