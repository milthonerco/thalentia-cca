import {
authManager
}

from "../lib/authStore";


if(typeof window !== "undefined"){

authManager.init();

}