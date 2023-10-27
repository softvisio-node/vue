<template>
    <div/>
</template>

<script>
export default {
    async mounted () {
        this.init();
    },

    "methods": {
        async init () {

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
    },
};
</script>
