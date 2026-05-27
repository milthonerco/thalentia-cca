import { authStore } from "../lib/authStore";
import { checkUserRole } from "../lib/authHelper";
import { supabase } from "../lib/supabase";

// Elementos de la interfaz del menú de usuario
const userBubble = document.getElementById("userBubble");
const popover = document.getElementById("popover");
const avatar = document.getElementById("avatar");
const userEmail = document.getElementById("userEmail");
const academyList = document.getElementById("academyList");
const logoutBtn = document.getElementById("logoutBtn");

// Botones condicionales por rol
const btnEstudiante = document.getElementById("btn-panel-estudiante");
const btnAdmin = document.getElementById("btn-panel-admin");

// ============= FUNCIÓN DE CIERRE DE SESIÓN UNIFICADA =============
async function cerrarSesionGlobal() {
  console.log("[Auth] Ejecutando cierre de sesión unificado y limpieza de caché...");
  try {
    // 1. Desloguear de Supabase
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Error en signOut de Supabase:", e);
  }

  // 2. Limpiar rigurosamente el almacenamiento local
  localStorage.removeItem("emailUsuario");
  
  // 3. Limpiar el estado en Nanostores
  authStore.set(null);

  // 4. Forzar la desaparición inmediata de la interfaz flotante
  if (userBubble) userBubble.classList.add("hidden");
  if (popover) popover.classList.add("hidden");
  if (btnAdmin) btnAdmin.classList.add("hidden");
  if (btnEstudiante) btnEstudiante.classList.add("hidden");

  // 5. Redirigir al home limpio
  window.location.href = "/";
}

// ============= INTERACCIÓN CLIC (TOGGLE POPOVER) =============
if (avatar && popover) {
  avatar.addEventListener("click", (e) => {
    e.stopPropagation();
    popover.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!popover.contains(e.target) && e.target !== avatar) {
      popover.classList.add("hidden");
    }
  });
}

// Asociar el botón interno del menú flotante
if (logoutBtn) {
  logoutBtn.addEventListener("click", cerrarSesionGlobal);
}

// ============= ADAPTAR MENÚ BASADO EN EL ROL DEL USUARIO =============
async function renderUserMenu() {
  const user = authStore.get();
  const localEmail = localStorage.getItem("emailUsuario");

  // Si no hay usuario ni email en localStorage, nos aseguramos de que esté oculto
  if (!user && !localEmail) {
    userBubble?.classList.add("hidden");
    popover?.classList.add("hidden");
    return;
  }

  const emailAValidar = user?.email || localEmail;

  if (!emailAValidar) {
    userBubble?.classList.add("hidden");
    popover?.classList.add("hidden");
    return;
  }

  // Seteamos la información básica inicial
  if (userEmail) userEmail.textContent = emailAValidar;
  if (avatar) {
    avatar.src = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${emailAValidar}`;
  }

  // Mostrar la burbuja flotante ya que hay una sesión activa detectada
  userBubble?.classList.remove("hidden");

  try {
    await cargarMisAcademiasMenu(emailAValidar);

    const { isAdmin } = await checkUserRole(emailAValidar);
    console.log(`[UserMenu] Perfil activo: ${emailAValidar} | ¿Es Admin?: ${isAdmin}`);

    if (isAdmin) {
      btnAdmin?.classList.remove("hidden");
      btnEstudiante?.classList.add("hidden");
    } else {
      btnEstudiante?.classList.remove("hidden");
      btnAdmin?.classList.add("hidden");
    }

  } catch (error) {
    console.error("[UserMenu] Error adaptando el menú por roles:", error);
    btnEstudiante?.classList.remove("hidden");
  }
}

// ============= FUNCIÓN AUXILIAR: CARGAR MIS ACADEMIAS =============
async function cargarMisAcademiasMenu(email) {
  if (!academyList) return;

  try {
    const { data, error } = await supabase
      .from("inscripciones")
      .select("academias(nombre)")
      .eq("student_email", email)
      .eq("estado", "activa");

    if (error) throw error;

    if (!data || data.length === 0) {
      academyList.innerHTML = '<li class="text-xs text-gray-400 italic">No tienes academias inscritas</li>';
      return;
    }

    academyList.innerHTML = data
      .map((ins) => {
        const nombreAcademia = ins.academias?.nombre || "Academia Activa";
        return `<li class="text-xs bg-gray-50 border rounded px-2 py-1 text-gray-700 truncate">🔹 ${nombreAcademia}</li>`;
      })
      .join("");

  } catch (err) {
    console.error("[UserMenu] Error obteniendo academias asociadas:", err);
    academyList.innerHTML = '<li class="text-xs text-red-500">Error cargando academias</li>';
  }
}

// Escuchar cambios de estado en el authStore
authStore.listen(() => {
  renderUserMenu();
});

// Hacer la función accesible desde otros scripts de la aplicación
window.cerrarSesionGlobal = cerrarSesionGlobal;

// Inicialización en la carga inicial
renderUserMenu();