import { atom } from "nanostores";
import { supabase } from "./supabase";

export const authStore =
atom<any>(null);


export const authManager = {

async init(){

const {

data:{session}

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

user?.email

&&

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
GUARDAR SOLO USER
NO SESSION
*/

authStore.set(
user
?? null
);



supabase.auth.onAuthStateChange(

async(
_event,
session
)=>{

const user=
session?.user;



if(

user?.email

&&

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
ACTUALIZAR STORE
*/

authStore.set(
user
?? null
);

}

);

}

};