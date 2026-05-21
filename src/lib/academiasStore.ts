import { atom } from "nanostores";
import { supabase } from "./supabase";

export const academiasStore =
atom<any[]>([]);

export const academiasLoaded =
atom(false);


export async function loadAcademias(){

if(
academiasLoaded.get()
)return;



const {

data,
error

}

=

await supabase

.from(
"academias"
)

.select(`
id,
nombre,
slug,
ruta_categoria,
categoria,
cupo_maximo,
inscritos_actuales,
activa
`)

.eq(
"activa",
true
);



if(
error
){

console.error(
error
);

return;

}



academiasStore.set(
data ?? []
);

academiasLoaded.set(
true
);

}