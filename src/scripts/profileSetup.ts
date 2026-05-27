import { supabase } from "../lib/supabase";
import { authStore } from "../lib/authStore";
import { checkUserRole } from "../lib/authHelper";

const modal = document.querySelector<HTMLDivElement>("#profileModal");
const guardar = document.querySelector<HTMLButtonElement>("#guardarPerfil");
const curso = document.querySelector<HTMLSelectElement>("#curso");

authStore.subscribe(async (user) => {
  console.log("------------------------------------------------");
  console.log("[ProfileSetup] 🔄 Store detectó cambio de usuario:", user?.email);

  if (!user || !user.email) {
    console.log("[ProfileSetup] 👤 No hay usuario logueado. Escondiendo modal.");
    modal?.classList.add("hidden");
    return;
  }

  const cleanEmail = user.email.trim().toLowerCase();

  // Consultamos el helper optimizado (una sola petición a la base de datos)
  const { isAdmin, isStudent, perfil } = await checkUserRole(cleanEmail);

  console.log(`[ProfileSetup] 🛡️ Evaluación de permisos para ${cleanEmail}:`);
  console.log(`               ¿Es Admin?: ${isAdmin}`);
  console.log(`               ¿Es Estudiante Activo?: ${isStudent}`);
  console.log(`               Perfil en BD:`, perfil);

  // REGLA 1: Si es Admin, jamás se muestra el modal
  if (isAdmin) {
    console.log("[ProfileSetup] 🔥 Bloqueo absoluto: Es ADMIN. Escondiendo modal.");
    modal?.classList.add("hidden");
    return;
  }

  // REGLA 2: Si es un estudiante y ya tiene curso asignado, se esconde el modal
  if (perfil && perfil.curso) {
    console.log(`[ProfileSetup] ✅ Estudiante registrado con curso ${perfil.curso}. Escondiendo modal.`);
    modal?.classList.add("hidden");
    return;
  }

  // REGLA 3: Si no tiene perfil o no tiene curso, significa que es un estudiante nuevo
  console.log("[ProfileSetup] ⚠️ Alerta: Registro incompleto o usuario nuevo. Mostrando modal.");
  modal?.classList.remove("hidden");
});

// Guardar los datos si es un estudiante nuevo
guardar?.addEventListener("click", async () => {
  const user = authStore.get();
  if (!user || !curso?.value) return;

  const cleanEmail = user.email.trim().toLowerCase();

  const { error } = await supabase
    .from("estudiantes")
    .insert({
      email: cleanEmail,
      nombre: user.user_metadata?.full_name,
      curso: curso.value,
      rol: "estudiante" // Se registra explícitamente con rol estudiante
    });

  if (error) {
    console.error("[ProfileSetup] ❌ Error al insertar nuevo estudiante:", error);
    return;
  }

  console.log("[ProfileSetup] 🎉 Estudiante registrado con éxito.");
  modal?.classList.add("hidden");
});