export const prerender = false;

import type { APIRoute } from "astro";

import {
    inscribirEstudiante
}
    from "../../lib/inscripciones";


export const POST: APIRoute =
    async ({ request }) => {

        try {

            const body =
                await request.json();

            const {

                slug,
                email

            }
                =
                body;


            if (!email) {

                return new Response(

                    JSON.stringify({

                        error:
                            "Usuario no autenticado"

                    }),

                    { status: 401 }

                );

            }


            await inscribirEstudiante(

                email,
                slug

            );


            return new Response(

                JSON.stringify({

                    success: true

                }),

                { status: 200 }

            );

        }

        catch (error: any) {

            const mensaje =
                error?.message
                ||
                "Error desconocido";


            const erroresEsperados = [

                "Máximo dos academias",

                "Ya estás inscrito",

                "No hay cupos disponibles",

                "Tu curso no puede ingresar",

                "Academia no encontrada",

                "Perfil estudiante no encontrado"

            ];


            if (

                erroresEsperados.includes(
                    mensaje
                )

            ) {

                console.warn(
                    "VALIDACION:",
                    mensaje
                );

            } else {

                console.error(
                    "ERROR SERVIDOR:",
                    error
                );

            }


            return new Response(

                JSON.stringify({

                    error: mensaje

                }),

                { status: 400 }

            );

        }

    };