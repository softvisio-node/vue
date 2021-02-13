import Store from "@softvisio/vuex";

export default class extends Store {
    record;

    async reload () {
        var res = await this.$api.call( "admin/settings/read" );

        if ( !res.ok ) {
            return res;
        }
        else {
            this.record = res.data;

            return res;
        }
    }

    async testSmtp () {
        const record = this.record;

        const values = {

            //
            "smtp_host": record.smtp_host,
            "smtp_port": record.smtp_port,
            "smtp_username": record.smtp_username,
            "smtp_password": record.smtp_password,
            "smtp_tls": record.smtp_tls,
        };

        const res = await this.$api.call( "admin/settings/test-smtp", values );

        return res;
    }
}
