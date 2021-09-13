<template>
    <div/>
</template>

<script>
export default {
    "computed": {
        isAuthenticated () {
            return this.$store.session.isAuthenticated;
        },
    },

    async mounted () {

        // init session
        while ( true ) {
            const res = await this.$store.session.signin();

            // connection ok
            if ( res.ok || res.status === 401 || res.status === 403 ) break;

            // connection error
            await this.onAppInitFailure();
        }
    },

    "methods": {
        async onAppInitFailure () {
            alert( `Server connection error. Press "OK" to try again.` );
        },
    },
};
</script>
