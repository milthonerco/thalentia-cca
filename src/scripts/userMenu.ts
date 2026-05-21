import { supabase } from "../lib/supabase";
import { authStore } from "../lib/authStore";


// ==========================
// ELEMENTOS
// ==========================

const bubble =
document.getElementById(
"userBubble"
);

const avatar =
document.getElementById(
"avatar"
);

const popover =
document.getElementById(
"popover"
);

const academyList =
document.getElementById(
"academyList"
);

const logoutBtn =
document.getElementById(
"logoutBtn"
);

const manageBtn =
document.getElementById(
"manageBtn"
);

const emailText =
document.getElementById(
"userEmail"
);


// ==========================
// TOGGLE
// ==========================

bubble?.addEventListener(

"click",

()=>{

popover?.classList.toggle(
"hidden"
);

}

);


// ==========================
// AUTH
// ==========================

authStore.subscribe(

(user)=>{


if(
!user
){

bubble?.classList.add(
"hidden"
);

return;

}



/*
MOSTRAR BURBUJA
*/

bubble?.classList.remove(
"hidden"
);



/*
AVATAR
*/

if(
avatar instanceof HTMLImageElement
){

avatar.src =

user.user_metadata
?.avatar_url

??

"/avatar-default.png";

}



/*
EMAIL
*/

if(
emailText
){

emailText.textContent=

user.email

??

"";

}



/*
ACADEMIAS
*/

loadAcademias(

user.email

?? ""

);


}

);


// ==========================
// CARGAR ACADEMIAS
// ==========================

async function
loadAcademias(

email:string

){

if(
!academyList
)return;



academyList.innerHTML=

`
<li class="text-gray-400 text-xs">

Cargando...

</li>
`;



const {

data,

error

}

=

await supabase

.from(
"inscripciones"
)

.select(

`
academia:
academias(

id,
nombre

)
`

)

.eq(
"student_email",
email
)

.eq(
"estado",
"activa"
);



if(
error
||
!data
){

academyList.innerHTML=

`
<li class="text-red-500">

Error

</li>
`;

return;

}



if(
data.length===0
){

academyList.innerHTML=

`
<li>

Sin academias

</li>
`;

return;

}



academyList.innerHTML=

data

.map(

(item:any)=>

`

<li>

📘

${item.academia?.nombre}

</li>

`

)

.join("");

}



// ==========================
// DASHBOARD
// ==========================

manageBtn?.addEventListener(

"click",

()=>{

window.location.href=
"/dashboard";

}

);


// ==========================
// LOGOUT
// ==========================

logoutBtn?.addEventListener(

"click",

async()=>{

await supabase
.auth
.signOut();


window.location.href=
"/";

}

);