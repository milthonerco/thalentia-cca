import { atom }
from "nanostores";

import {
supabase
}
from "./supabase";


export const authStore =
atom<any>(null);


export const authManager={

async init(){

const {

data:{
session
}

}

=

await supabase
.auth
.getSession();


const user =
session?.user;


/*
VALIDAR DOMINIO
*/

if(

user?.email &&

!user.email.endsWith(
"@cca.edu.co"
)

){

await supabase
.auth
.signOut();

authStore.set(
null
);

return;

}


/*
GUARDAR USER
*/

authStore.set(
user ?? null
);


if(user?.email){

localStorage.setItem(

"emailUsuario",

user.email

);

}


/*
CAMBIOS SESION
*/

supabase.auth
.onAuthStateChange(

async(
_event,
session
)=>{

const user=
session?.user;


authStore.set(
user ?? null
);


if(user?.email){

localStorage.setItem(

"emailUsuario",

user.email

);

}

}

);

}

};