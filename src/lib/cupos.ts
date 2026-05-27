import { supabase } from "./supabase";

type Academia = {
    id: string;
    nombre: string;
    slug: string;
    categoria: string;
    descripcion: string | null;
    cupo_maximo: number;
    activa: boolean;
    coordinador_email: string | null;
    cursos_permitidos: number[];
    ruta_categoria: string;
};

type AcademiaConCupos = Academia & {
    cuposDisponibles: number;
};

export async function obtenerCupos(
    email: string
): Promise<AcademiaConCupos[]> {

    const { data: estudiante } =
    await supabase
        .from("estudiantes")
        .select("curso")
        .eq("email", email)
        .single();

    if (!estudiante) return [];

    const { data: academias } =
    await supabase
        .from("academias")
        .select("*")
        .eq("activa", true);

    if (!academias) return [];

    const filtradas = academias.filter(

        a =>

        a.cursos_permitidos?.includes(
            estudiante.curso
        )

    );

    if (!filtradas.length) return [];


    /*
    UNA SOLA CONSULTA
    EN VEZ DE 20 COUNTS
    */

    const ids = filtradas.map(
        a => a.id
    );

    const {

        data: inscripciones

    }

    =

    await supabase

        .from("inscripciones")

        .select(`
            academia_id,
            estado
        `)

        .in(
            "academia_id",
            ids
        )

        .eq(
            "estado",
            "activa"
        );


    return filtradas.map(

        academia => {

            const inscritos =

                inscripciones?.filter(

                    i =>

                    i.academia_id
                    ===
                    academia.id

                ).length

                ||

                0;


            return {

                ...academia,

                cuposDisponibles:

                    academia.cupo_maximo

                    -

                    inscritos

            };

        }

    );

}