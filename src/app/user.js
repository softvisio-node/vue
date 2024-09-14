import constants from "@softvisio/app/constants";
import { reactive } from "vue";
import Permissions from "@softvisio/app/user/permissions";

export default class User {
    #app;
    #id;
    #email;
    #locale;
    #avatarUrl;
    #permissions;
    #reactive = reactive( {
        "emailConfirmed": false,
    } );

    constructor ( app, data, permissions ) {
        this.#app = app;
        this.#id = data?.id;
        this.#email = data?.email;
        this.#reactive.emailConfirmed = data?.email_confirmed ?? false;
        this.#locale = data?.locale;
        this.#avatarUrl = data?.avatar_url;
        this.#permissions = new Permissions( this.#id, permissions );
    }

    // properties
    get app () {
        return this.#app;
    }

    get id () {
        return this.#id;
    }

    get email () {
        return this.#email;
    }

    get isEmailConfirmed () {
        return this.#reactive.emailConfirmed;
    }

    get locale () {
        return this.#locale;
    }

    get avatarUrl () {
        return this.#avatarUrl;
    }

    get isRoot () {
        return this.#id === constants.rootUserId;
    }

    get permissions () {
        return this.#permissions;
    }

    // public
    setEmailConfirmed ( value ) {
        this.#reactive.emailConfirmed = !!value;
    }
}
