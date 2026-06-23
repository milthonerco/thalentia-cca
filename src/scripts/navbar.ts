import { supabase } from "../lib/supabase";
import { authStore } from "../lib/authStore";

function initNavbar() {
    const studentBtn = document.getElementById("studentBtn");
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const navbarMenu = document.getElementById("navbarMenu");
    const hamburgerIcon = document.getElementById("hamburgerIcon");

    // LÓGICA DE AUTENTICACIÓN ORIGINAL
    authStore.subscribe((user) => {
        if (!(studentBtn instanceof HTMLButtonElement)) return;

        if (user) {
            studentBtn.classList.add("hidden");
        } else {
            studentBtn.classList.remove("hidden");
        }
    });

    if (studentBtn instanceof HTMLButtonElement) {
        studentBtn.addEventListener("click", async () => {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin
                }
            });
        });
    }

    // LÓGICA INTERACTIVA DEL MENÚ HAMBURGUESA
    if (hamburgerBtn && navbarMenu && hamburgerIcon) {
        hamburgerBtn.addEventListener("click", () => {
            const isHidden = navbarMenu.classList.contains("hidden");

            if (isHidden) {
                // Abrir el menú móvil
                navbarMenu.classList.remove("hidden");
                navbarMenu.classList.add("flex");
                // Cambiar el icono SVG a una "X"
                hamburgerIcon.setAttribute("d", "M18.3 5.71a1 1 0 0 0-1.42 0L12 10.59 7.12 5.7a1 1 0 0 0-1.41 1.41L10.59 12l-4.88 4.88a1 1 0 0 0 1.41 1.41L12 13.41l4.88 4.88a1 1 0 0 0 1.42-1.41L13.41 12l4.89-4.88a1 1 0 0 0 0-1.41z");
            } else {
                // Cerrar el menú móvil
                navbarMenu.classList.add("hidden");
                navbarMenu.classList.remove("flex");
                // Revertir el icono SVG a las 3 barras originales
                hamburgerIcon.setAttribute("d", "M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z");
            }
        });
    }
}

// Ejecutar al cargar la página (Soporta transiciones nativas y recargas)
document.addEventListener("DOMContentLoaded", initNavbar);
document.addEventListener("astro:page-load", initNavbar);