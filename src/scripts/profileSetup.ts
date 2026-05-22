import { supabase }
from "../lib/supabase";

import { authStore }
from "../lib/authStore";


const modal =
document.querySelector<HTMLDivElement>(
"#profileModal"
);


const guardar =
document.querySelector<HTMLButtonElement>(
"#guardarPerfil"
);


const curso =
document.querySelector<HTMLSelectElement>(
"#curso"
);



authStore.subscribe(

async(user)=>{

if(!user)
return;


/*
BUSCAR PERFIL
*/

const {

data:perfil,

error

}

=

await supabase

.from(
"estudiantes"
)

.select(
"id,email,curso"
)

.eq(
"email",
user.email
)

.maybeSingle();

/*
SI NO EXISTE
*/

if(
!perfil
){

modal?.classList.remove(
"hidden"
);

}else{

modal?.classList.add(
"hidden"
);

}


});




guardar?.addEventListener(

"click",

async()=>{

const user=
authStore.get();

if(
!user
||
!curso?.value
)
return;



const { error }

=

await supabase

.from(
"estudiantes"
)

.insert({

email:
user.email,

nombre:

user.user_metadata

.full_name,

curso:
curso.value

});



if(error){

console.log(
error
);

return;

}



modal?.classList.add(
"hidden"
);

}

);