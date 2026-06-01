import { authStore } from "../lib/authStore";
import { checkUserRole } from "../lib/authHelper";

const manageBtn = document.getElementById("manageBtn");

if (manageBtn) {
  manageBtn.onclick = async (e) => {
    e.preventDefault();
    
    // Forzamos la lectura del usuario directamente del store
    const user = authStore.get();
    
  

    if (!user || !user.email) {
      // Intento de respaldo: Buscar en localStorage si el store tardó en responder
      const localEmail = localStorage.getItem("emailUsuario");
      if (localEmail) {

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
   

    if (isAdmin) {

      window.location.href = "/admin/dashboard";
    } else {

      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error("[MiniDashboard] Error validando rol:", error);
    window.location.href = "/dashboard";
  }
}