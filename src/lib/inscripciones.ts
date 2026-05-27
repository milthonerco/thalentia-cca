import { supabaseAdmin } from "./supabaseAdmin";

export async function inscribirEstudiante(

email:string,
slugAcademia:string

){

/*
==========================
ESTUDIANTE
==========================
*/

const {

data:estudiante

}

=

await supabaseAdmin

.from("estudiantes")

.select("*")

.eq(

"email",

email

)

.single();


if(

!estudiante

){

throw new Error(

"Perfil estudiante no encontrado"

);

}



/*
==========================
ACADEMIA SEGÚN CURSO
==========================
*/

const {

data:academias

}

=

await supabaseAdmin

.from("academias")

.select("*")

.eq(

"slug",

slugAcademia

);



if(

!academias?.length

){

throw new Error(

"Academia no encontrada"

);

}



/*
BUSCAR ACADEMIA
PARA EL CURSO
DEL ESTUDIANTE
*/

const academia =

academias.find(

a =>

a.cursos_permitidos

?.includes(

estudiante.curso

)

);



if(

!academia

){

throw new Error(

"Esta academia no está disponible para tu curso"

);

}



/*
==========================
VALIDAR CUPOS
==========================
*/

if(

academia.inscritos_actuales

>=

academia.cupo_maximo

){

throw new Error(

"No hay cupos disponibles"

);

}



/*
==========================
MÁXIMO 2 ACADEMIAS
==========================
*/

const {

count

}

=

await supabaseAdmin

.from("inscripciones")

.select(

"*",

{

count:"exact",

head:true

}

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

count

&&

count >= 2

){

throw new Error(

"Máximo dos academias"

);

}



/*
==========================
YA INSCRITO
(SOLO ACTIVAS)
==========================
*/

const {

data:existente

}

=

await supabaseAdmin

.from("inscripciones")

.select("id")

.eq(

"student_email",

email

)

.eq(

"academia_id",

academia.id

)

.eq(

"estado",

"activa"

)

.maybeSingle();



if(

existente

){

throw new Error(

"Ya estás inscrito"

);

}



/*
==========================
CREAR INSCRIPCIÓN
==========================
*/

const {

error:insertError

}

=

await supabaseAdmin

.from("inscripciones")

.insert({

student_email:

email,

academia_id:

academia.id,

categoria:

academia.categoria,

estado:

"activa"

});



if(

insertError

){

console.error(

insertError

);

throw new Error(

"No fue posible registrar inscripción"

);

}



/*
==========================
SUMAR CUPO
==========================
*/

const {

error:updateError

}

=

await supabaseAdmin

.from("academias")

.update({

inscritos_actuales:

academia.inscritos_actuales

+

1

})

.eq(

"id",

academia.id

);



if(

updateError

){

throw new Error(

"No fue posible actualizar cupos"

);

}



return true;

}