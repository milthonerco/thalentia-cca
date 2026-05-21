import { supabase }
from "./supabase";


export async function
obtenerAcademias(){

const {
data,
error
}
=
await supabase

.from("academias")

.select("*")

.eq(
"activa",
true
);


if(error){

console.error(error);

return [];

}


return data;

}