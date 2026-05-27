import { authStore } from "../lib/authStore";
import { checkUserRole } from "../lib/authHelper";

async function verificarSeguridadAdmin() {
  const user = authStore.get();
  const localEmail = localStorage.getItem("emailUsuario");

  // 1. Esperar la inicialización del ciclo de vida de autenticación
  if (!user && !localEmail) {
    setTimeout(verificarSeguridadAdmin, 50);
    return;
  }

  const emailAValidar = user?.email || localEmail;

  if (!emailAValidar) {
    console.warn("[🔐 Guardián] Acceso denegado. No se encontró ninguna sesión activa.");
    window.location.replace("/");
    return;
  }

  try {
    // 2. Comprobar rol administrativo real contra Supabase
    const { isAdmin } = await checkUserRole(emailAValidar);
    console.log(`[🔐 Guardián] Perfil verificado: ${emailAValidar} | Rol Administrador: ${isAdmin}`);

    if (!isAdmin) {
      console.error("[🔐 Guardián] Acceso no autorizado para este usuario. Redirigiendo...");
      window.location.replace("/dashboard");
      return;
    }

    // 3. Modificar componentes visuales del perfil
    const avatarImg = document.getElementById("admin-avatar") as HTMLImageElement;
    const nameTxt = document.getElementById("admin-name");
    const emailTxt = document.getElementById("admin-email");
    const bodyContainer = document.getElementById("admin-body");

    if (avatarImg && user?.user_metadata?.avatar_url) {
      avatarImg.src = user.user_metadata.avatar_url;
    }
    if (nameTxt) {
      nameTxt.textContent = user?.user_metadata?.full_name || "Administrador";
    }
    if (emailTxt) {
      emailTxt.textContent = emailAValidar;
    }

    // Quitar la opacidad segura una vez validada la sesión
    if (bodyContainer) {
      bodyContainer.classList.remove("opacity-0");
    }

    // Cargar dinámicamente el script operativo del panel analítico
    await import("./admin-dashboard.js");

  } catch (error) {
    console.error("[🔐 Guardián] Error de validación interna:", error);
    window.location.replace("/dashboard");
  }
}

// Iniciar proceso de validación
verificarSeguridadAdmin();