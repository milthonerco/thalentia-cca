import { atom } from "nanostores";
import { supabase } from "./supabase";

export const academiasStore =
atom<any[]>([]);


export async function
loadAcademias(){

if(
academiasStore.get().length>0
)return;


const {data}
=
await supabase

.from(
"academias"
)

.select("*")

.eq(
"activa",
true
);


academiasStore.set(
data ?? []
);

}