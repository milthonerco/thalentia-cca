import { supabase } from "./supabase";

type Academia = {
    id: string;
    nombre: string;
    slug: string;
    categoria: string;
    descripcion: string | null;
    cupo_maximo: number;       // <-- Ya lo tenías
    inscritos_actuales: number; // <-- ¡Añadimos tu columna real!
    activa: boolean;
    coordinador_email: string | null;
    cursos_permitidos: number[];
    ruta_categoria: string;
};

// Modificamos el tipo extendido para usar tus datos reales
type AcademiaConCupos = Academia & {
    cuposDisponibles: number;
};

export async function obtenerCupos(
    email: string
): Promise<AcademiaConCupos[]> {

    const { data: estudiante } = await supabase
        .from("estudiantes")
        .select("curso")
        .eq("email", email)
        .single();

    if (!estudiante) return [];

    // Traemos de una vez tus columnas físicas
    const { data: academias } = await supabase
        .from("academias")
        .select("*") 
        .eq("activa", true);

    if (!academias) return [];

    const filtradas = academias.filter(
        a => a.cursos_permitidos?.includes(estudiante.curso)
    );

    if (!filtradas.length) return [];

    // Borramos toda la consulta secundaria a la tabla "inscripciones".
    // Ahora simplemente calculamos el flag virtual basándonos en tus columnas.
    return filtradas.map(academia => {
        return {
            ...academia,
            // Si tus columnas físicas dicen 30 y 30, esto dará 0
            cuposDisponibles: academia.cupo_maximo - academia.inscritos_actuales
        };
    });
}