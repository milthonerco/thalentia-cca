export const prerender = false;

import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { academiaId, studentEmail } = await request.json();

        /*
        ===========================================================================
        1. VALIDAR CONFIGURACIÓN Y TIEMPO LÍMITE DE LA ACADEMIA (PROTECCIÓN BACKEND)
        ===========================================================================
        */
        const { data: academia, error: academiaError } = await supabaseAdmin
            .from("academias")
            .select("inscritos_actuales, fecha_cierre, permitir_cancelacion")
            .eq("id", academiaId)
            .single();

        if (academiaError || !academia) {
            throw new Error("Academia no encontrada");
        }

        // Validación de fecha límite expirada
        if (academia.fecha_cierre) {
            const ahora = new Date();
            const fechaCierre = new Date(academia.fecha_cierre);
            if (ahora > fechaCierre) {
                throw new Error("El tiempo límite para cancelar inscripciones ha expirado");
            }
        }

        // Validación de flag de cancelación por si el admin la bloqueó manualmente
        if (academia.permitir_cancelacion === false) {
            throw new Error("Los retiros de esta academia se encuentran bloqueados");
        }

        /*
        ===========================================================================
        2. BUSCAR INSCRIPCIÓN
        ===========================================================================
        */
        const { data: inscripcion } = await supabaseAdmin
            .from("inscripciones")
            .select("*")
            .eq("academia_id", academiaId)
            .eq("student_email", studentEmail)
            .eq("estado", "activa")
            .single();

        if (!inscripcion) {
            throw new Error("No existe inscripción activa para este estudiante");
        }

        /*
        ===========================================================================
        3. MODIFICAR ESTADO A CANCELADA
        ===========================================================================
        */
        await supabaseAdmin
            .from("inscripciones")
            .update({ estado: "cancelada" })
            .eq("id", inscripcion.id);

        /*
        ===========================================================================
        4. LIBERAR CUPO EN LA ACADEMIA
        ===========================================================================
        */
        await supabaseAdmin
            .from("academias")
            .update({
                inscritos_actuales: Math.max(0, academia.inscritos_actuales - 1)
            })
            .eq("id", academiaId);

        return new Response(
            JSON.stringify({ success: true })
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({
                success: false,
                error: err.message
            }),
            { status: 400 }
        );
    }
};