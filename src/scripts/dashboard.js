import { supabase } from "/src/lib/supabase.js";
import { obtenerCupos } from "/src/lib/cupos.js";

async function renderDashboard() {

try {

const {
data:{session}
}

=

await supabase.auth.getSession();


if(!session){

window.location.href="/";
return;

}


const email=
session.user.email;


/*
=================
USUARIO
=================
*/

document.getElementById(
"usuario"
).innerHTML=

`
<img
class="w-11 h-11 rounded-full object-cover"
src="${
session.user.user_metadata?.avatar_url
||
"https://ui-avatars.com/api/?name=User"
}"
>

<div>

<h3 class="text-sm font-bold">

${
session.user.user_metadata?.full_name
||
"Usuario"
}

</h3>

<p class="text-xs">

${email}

</p>

</div>

`;


/*
=================
MIS ACADEMIAS
=================
*/

const {

data:misAcademias

}

=

await supabase

.from("inscripciones")

.select(`

id,

academias(

id,
nombre,
slug,
categoria,
ruta_categoria

)

`)

.eq(
"student_email",
email
)

.eq(
"estado",
"activa"
);



document.getElementById(
"contador"
).innerHTML=

`

<b>

${misAcademias?.length||0}

</b>

academias inscritas

`;



document.getElementById(
"misAcademias"
).innerHTML=

misAcademias?.map(

item=>{

if(
!item.academias
)
return "";

return`

<div
class="
border
rounded-xl
p-3
bg-white
flex
flex-col
gap-2
shadow-sm
"
>

<b>

${item.academias.nombre}

</b>

<span>

${item.academias.categoria}

</span>

<div
class="
flex
justify-between
items-center
"
>

<button

class="
btn-abandonar
text-red-600
text-sm
"

data-id="${item.academias.id}"

data-email="${email}"

>

❌ Salir

</button>

<a

href="/categories/${item.academias.ruta_categoria}/${item.academias.slug}"

>

Ver →

</a>

</div>

</div>

`;

}

).join("")

||

"<p>Sin academias</p>";



/*
=================
ACADEMIAS DISPONIBLES
=================
*/

const academias=

await obtenerCupos(
email
);


document.getElementById(
"academias"
).innerHTML=

academias.map(

a=>{

const disponible=

a.cuposDisponibles>0;


return`

<a

href="/categories/${a.ruta_categoria}/${a.slug}"

class="

rounded-xl
p-4
border-2
transition
hover:-translate-y-1

${

disponible

?

`

border-green-500
bg-green-50

`

:

`

border-red-500
bg-red-50

`

}

"

>

<b>

${a.nombre}

</b>

<p>

${a.categoria}

</p>

<div
class="mt-2"
>

<span

class="

font-bold
px-2
py-1
rounded-full

${

disponible

?

"bg-green-100 text-green-700"

:

"bg-red-100 text-red-700"

}

"

>

${

disponible

?

"Disponible"

:

"No disponible"

}

</span>

</div>

</a>

`;

}

).join("");



asignarEventos();

}

catch(err){

console.error(
"Dashboard:",
err
);

}

}



/*
=================
SALIR ACADEMIA
=================
*/

function asignarEventos(){

document

.querySelectorAll(
".btn-abandonar"
)

.forEach(

btn=>{

btn.onclick=

async()=>{

const academiaId=

btn.dataset.id;

const studentEmail=

btn.dataset.email;


if(

!confirm(
"¿Salir de esta academia?"
)

)

return;


btn.disabled=true;

btn.textContent=
"Procesando...";


try{

const response=

await fetch(

"/api/cancel-inscription",

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:

JSON.stringify({

academiaId,

studentEmail

})

}

);


const data=

await response.json();


if(

!response.ok

){

throw new Error(

data.error

||

"Error"

);

}


alert(
"Academia abandonada"
);


await renderDashboard();

}

catch(error){

console.error(
error
);

alert(

error.message

||

"No fue posible salir"

);


btn.disabled=false;

btn.textContent=
"❌ Salir";

}

};

}

);

}



/*
=================
LOGOUT
=================
*/

const logout=

document.getElementById(
"logout"
);


if(logout){

logout.style.display=
"inline-flex";


logout.onclick=

async()=>{

await supabase.auth.signOut();

window.location.href="/";

};

}



renderDashboard();