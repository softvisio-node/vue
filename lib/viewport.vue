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
            console.log( "--- MOUN 1" );

            // init session
            while ( true ) {
                const res = await this.$app.signin();

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
