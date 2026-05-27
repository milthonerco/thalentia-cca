export const prerender = false;

import type { APIRoute }

    from "astro";

import {

    supabaseAdmin

}

    from "../../lib/supabaseAdmin";


export const POST:

    APIRoute =

    async ({ request }) => {

        try {

            const {

                academiaId,

                studentEmail

            }

                =

                await request.json();



            /*
            BUSCAR INSCRIPCIÓN
            */

            const {

                data: inscripcion

            }

                =

                await supabaseAdmin

                    .from("inscripciones")

                    .select("*")

                    .eq(

                        "academia_id",

                        academiaId

                    )

                    .eq(

                        "student_email",

                        studentEmail

                    )

                    .eq(

                        "estado",

                        "activa"

                    )

                    .single();



            if (!inscripcion) {

                throw new Error(

                    "No existe inscripción"

                );

            }



            /*
            CANCELAR
            */

            await supabaseAdmin

                .from("inscripciones")

                .update({

                    estado:

                        "cancelada"

                })

                .eq(

                    "id",

                    inscripcion.id

                );



            /*
            LIBERAR CUPO
            */

            const {

                data: academia,

                error: academiaError

            }

                =

                await supabaseAdmin

                    .from("academias")

                    .select(

                        "inscritos_actuales"

                    )

                    .eq(

                        "id",

                        academiaId

                    )

                    .single();


            if (

                academiaError ||

                !academia

            ) {

                throw new Error(

                    "Academia no encontrada"

                );

            }


            await supabaseAdmin

                .from("academias")

                .update({

                    inscritos_actuales:

                        Math.max(

                            0,

                            academia.inscritos_actuales - 1

                        )

                })

                .eq(

                    "id",

                    academiaId

                );



            return new Response(

                JSON.stringify({

                    success: true

                })

            );

        }

        catch (err: any) {

            return new Response(

                JSON.stringify({

                    success: false,

                    error:

                        err.message

                }),

                {

                    status: 400

                }

            );


        }


    };