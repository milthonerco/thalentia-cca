/*
IMPORTANTE:
usar /src NO ../lib
*/

import { supabase }
from "/src/lib/supabase.js";

import {
academiasStore,
loadAcademias
}
from "/src/lib/academiasStore.js";



try{

/* ==================
SESION
================== */

const {
data:{session}
}

=

await supabase.auth.getSession();


if(!session){

window.location.href="/";
throw new Error("Sin sesión");

}



const usuario=
document.getElementById("usuario");


usuario.innerHTML=

`

<img src="${
session.user.user_metadata?.avatar_url
||
"https://ui-avatars.com/api/?name=User"
}">


<div>

<h3>

${
session.user.user_metadata?.full_name
||
"Usuario"
}

</h3>

<p>

${session.user.email}

</p>

</div>

`;



/* ==================
LOGOUT
================== */

const logout=
document.getElementById("logout");

logout.style.display=
"inline-block";

logout.addEventListener(

"click",

async()=>{

await supabase.auth.signOut();

window.location.href="/";

}

);



/* ==================
MIS ACADEMIAS
================== */

const {

data:misAcademias,
error

}

=

await supabase

.from("inscripciones")

.select(

`

academias(

nombre,
slug,
categoria,
ruta_categoria

)

`

)

.eq(
"student_email",
session.user.email
)

.eq(
"estado",
"activa"



);


if(error){

console.error(error);

}



document.getElementById(
"contador"
).innerHTML=

`

<b>

${misAcademias?.length || 0}

de 2

</b>

academias inscritas

`;



document.getElementById(
"misAcademias"
).innerHTML=

misAcademias?.map(

(item)=>{

if(!item.academias) return "";

return `

<a

href="/categories/${item.academias.ruta_categoria}/${item.academias.slug}"

class="academy"

>

<h3>

${item.academias.nombre}

</h3>

<span class="badge">

${item.academias.categoria}

</span>

<div class="academy-footer">

<span class="verde">

Inscrito

</span>

<span>

Abrir →

</span>

</div>

</a>

`;

}

).join("")

||

"Sin academias";



/* ==================
ACADEMIAS
================== */

await loadAcademias();

const academias=

academiasStore.get
? academiasStore.get()
: [];


document.getElementById(
"academias"
).innerHTML=

academias.map(

(a)=>{

const disponibles=

a.cupo_maximo
-
a.inscritos_actuales;



return`

<a

href="/categories/${a.ruta_categoria}/${a.slug}"

class="academy"

>

<h3>

${a.nombre}</h3>

<span class="badge">

${a.categoria}

</span>

<div class="academy-footer">

${
disponibles>0

?

`<span class="verde">

${disponibles} cupos

</span>`

:

`<span class="rojo">

SIN CUPOS

</span>`

}

<span>

Ver →

</span>

</div>

</a>

`;

}

).join("");

}
catch(err){

console.error(
"Dashboard error:",
err
);

}