import { supabase }
from "./supabase";


export async function
misInscripciones(
email: string
){

const {
data,
error
}
=
await supabase

.from(
"inscripciones"
)

.select("*")

.eq(
"student_email",
email
)

.eq(
"estado",
"activa"
);


return data;

}