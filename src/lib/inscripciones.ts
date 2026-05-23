import { supabase } from "./supabase";

export async function inscribirEstudiante(

email:string,
slugAcademia:string

){

/*
ESTUDIANTE
*/

const resultado =
await supabase

.from("estudiantes")

.select("*")

.eq(
"email",
email
);


const estudiante =
resultado.data?.[0];


if(!estudiante){

throw new Error(
"Perfil estudiante no encontrado"
);

}


/*
ACADEMIA
*/

const resultadoAcademia =
await supabase

.from("academias")

.select("*")

.eq(
"slug",
slugAcademia);


const academia =
resultadoAcademia.data?.[0];


if(!academia){

throw new Error(
"Academia no encontrada"
);

}


/*
CURSO PERMITIDO
*/

const permitido =
academia.cursos_permitidos
?.includes(
estudiante.curso
);


if(!permitido){

throw new Error(
"Tu curso no puede ingresar"
);

}


/*
CUPOS
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
MAX 2 ACADEMIAS
*/

const {

count

}

=

await supabase

.from("inscripciones")

.select("*",{

count:"exact",

head:true

})

.eq(
"student_email",
email
)

.eq(
"estado",
"activa"
);


if(

count &&
count>=2

){

throw new Error(
"Máximo dos academias"
);

}


/*
YA INSCRITO
*/

const {

data:existente

}

=

await supabase

.from("inscripciones")

.select("*")

.eq(
"student_email",
email
)

.eq(
"academia_id",
academia.id
)

.maybeSingle();


if(existente){

throw new Error(
"Ya estás inscrito"
);

}


/*
INSERTAR
*/

const {

error:insertError

}

=

await supabase

.from("inscripciones")

.insert({

student_email:
email,

academia_id:
academia.id,

categoria:
academia.categoria

});


if(insertError){

throw new Error(
"No fue posible registrar inscripción"
);

}


/*
ACTUALIZAR CUPOS
*/

const {

error:updateError

}

=

await supabase

.from("academias")

.update({

inscritos_actuales:
academia.inscritos_actuales + 1

})

.eq(
"id",
academia.id
);


if(updateError){

throw new Error(
"No fue posible actualizar cupos"
);

}


return true;

}