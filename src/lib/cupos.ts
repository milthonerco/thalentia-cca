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
};

type AcademiaConCupos = Academia & {
    cuposDisponibles: number;
};

export async function obtenerCupos():
Promise<AcademiaConCupos[]> {

    const {
        data: academias,
        error
    } =
    await supabase

        .from("academias")

        .select("*")

        .eq("activa", true);


    if (error) {

        console.error(
            "Error academias:",
            error.message
        );

        return [];
    }


    if (!academias) {

        return [];
    }


    const resultado:
    AcademiaConCupos[] = [];


    for (const academia of academias) {

        const {

            count,

            error: errorCount

        }

        =

        await supabase

            .from("inscripciones")

            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )

            .eq(
                "academia_id",
                academia.id
            )

            .eq(
                "estado",
                "activa"
            );


        if (errorCount) {

            console.error(
                "Error contando:",
                errorCount.message
            );

            continue;
        }


        resultado.push({

            ...academia,

            cuposDisponibles:

                academia.cupo_maximo

                -

                (count ?? 0)

        });

    }


    return resultado;

}