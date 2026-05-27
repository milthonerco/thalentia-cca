import { authStore } from "../lib/authStore";
import { checkUserRole } from "../lib/authHelper";

const manageBtn = document.getElementById("manageBtn");

if (manageBtn) {
  manageBtn.onclick = async (e) => {
    e.preventDefault();
    
    // Forzamos la lectura del usuario directamente del store
    const user = authStore.get();
    
    console.log("[MiniDashboard] Clic en Administrar. Usuario en Store:", user?.email);

    if (!user || !user.email) {
      // Intento de respaldo: Buscar en localStorage si el store tardó en responder
      const localEmail = localStorage.getItem("emailUsuario");
      if (localEmail) {
        console.log("[MiniDashboard] Store vacío pero email hallado en LocalStorage:", localEmail);
        await validarYRedirigir(localEmail);
      } else {
        console.warn("[MiniDashboard] Sin sesión activa. Redirigiendo al Home.");
        window.location.replace("/");
      }
    } else {
      await validarYRedirigir(user.email);
    }
  };
}

// Función aislada para decidir a dónde mandar al usuario según su Rol Real
async function validarYRedirigir(email: string) {
  try {
    const { isAdmin } = await checkUserRole(email);
    console.log(`[MiniDashboard] Resultado de Rol para ${email} => ¿Es Admin?: ${isAdmin}`);

    if (isAdmin) {
      console.log("[MiniDashboard] 🛡️ Rol Admin detectado. Enviando a /admin/dashboard");
      window.location.href = "/admin/dashboard";
    } else {
      console.log("[MiniDashboard] 🎓 Rol Estudiante detectado. Enviando a /dashboard");
      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error("[MiniDashboard] Error validando rol:", error);
    window.location.href = "/dashboard";
  }
}