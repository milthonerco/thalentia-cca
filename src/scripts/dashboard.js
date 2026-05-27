import { supabase } from "/src/lib/supabase.js";
import { obtenerCupos } from "/src/lib/cupos.js";

async function renderDashboard() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/";
      return;
    }

    const email = session.user.email;

    /*
    =================
    USUARIO
    =================
    */
    const usuarioEl = document.getElementById("usuario");
    if (usuarioEl) {
      usuarioEl.innerHTML = `
        <img
          class="w-11 h-11 rounded-full object-cover"
          src="${session.user.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=User"}"
          alt="Avatar"
        >
        <div>
          <h3 class="text-sm font-bold">
            ${session.user.user_metadata?.full_name || "Usuario"}
          </h3>
          <p class="text-xs">${email}</p>
        </div>
      `;
    }

    /*
    =================
    MIS ACADEMIAS
    =================
    */
    const { data: misAcademias } = await supabase
      .from("inscripciones")
      .select(`
        id,
        academias(
          id,
          nombre,
          slug,
          categoria,
          ruta_categoria,
          activa
        )
      `)
      .eq("student_email", email)
      .eq("estado", "activa");

    const contadorEl = document.getElementById("contador");
    if (contadorEl) {
      contadorEl.innerHTML = `<b>${misAcademias?.length || 0}</b> academias inscritas`;
    }

    const misAcademiasEl = document.getElementById("misAcademias");
    if (misAcademiasEl) {
      misAcademiasEl.innerHTML = misAcademias?.map((item) => {
        if (!item.academias) return "";

        // Ocultar o mostrar botón "Salir" dependiendo de si la academia está activa en la base de datos
        const esAcademiaActiva = item.academias.activa;
        
        return `
          <div class="border rounded-xl p-3 bg-white flex flex-col gap-2 shadow-sm text-black">
            <b>${item.academias.nombre}</b>
            <span>${item.academias.categoria}</span>
            <div class="flex justify-between items-center mt-2">
              
              ${esAcademiaActiva 
                ? `
                  <button
                    class="btn-abandonar text-red-600 text-sm font-medium hover:text-red-800 transition-colors"
                    data-id="${item.academias.id}"
                    data-email="${email}"
                  >
                    ❌ Salir
                  </button>
                ` 
                : `<span class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">🔒 Academia Bloqueada</span>`
              }

              <a 
                href="/categories/${item.academias.ruta_categoria}/${item.academias.slug}"
                class="text-blue-600 text-sm hover:underline font-medium"
              >
                Ver →
              </a>
            </div>
          </div>
        `;
      }).join("") || "<p class='text-gray-500 italic text-sm'>Sin academias vinculadas actualmente</p>";
    }

    /*
    =================
    ACADEMIAS DISPONIBLES
    =================
    */
    const academias = await obtenerCupos(email);
    const academiasEl = document.getElementById("academias");
    
    if (academiasEl) {
      academiasEl.innerHTML = academias.map((a) => {
        const disponible = a.cuposDisponibles > 0;

        return `
          <a
            href="/categories/${a.ruta_categoria}/${a.slug}"
            class="rounded-xl p-4 border-2 transition hover:-translate-y-1 block text-black ${
              disponible ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
            }"
          >
            <b>${a.nombre}</b>
            <p class="text-sm text-gray-600">${a.categoria}</p>
            <div class="mt-2">
              <span class="text-xs font-bold px-2 py-1 rounded-full ${
                disponible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }">
                ${disponible ? "Disponible" : "No disponible"}
              </span>
            </div>
          </a>
        `;
      }).join("");
    }

    asignarEventos();

  } catch (err) {
    console.error("Error cargando Dashboard:", err);
  }
}

/*
=================
SALIR ACADEMIA
=================
*/
function asignarEventos() {
  document.querySelectorAll(".btn-abandonar").forEach((btn) => {
    btn.onclick = async () => {
      const academiaId = btn.dataset.id;
      const studentEmail = btn.dataset.email;

      if (!confirm("¿Estás seguro de que deseas salir de esta academia?")) return;

      btn.disabled = true;
      btn.textContent = "Procesando...";

      try {
        const response = await fetch("/api/cancel-inscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ academiaId, studentEmail })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Error al procesar la desvinculación");

        alert("Academia abandonada con éxito");
        await renderDashboard();

      } catch (error) {
        console.error(error);
        alert(error.message || "No fue posible procesar la salida");
        btn.disabled = false;
        btn.textContent = "❌ Salir";
      }
    };
  });
}

/*
=================
LOGOUT OPTIMIZADO COHERENTE
=================
*/
const logout = document.getElementById("logout");

if (logout) {
  logout.style.display = "inline-flex";

  logout.onclick = async (e) => {
    e.preventDefault();
    
    // Si la función unificada del UserMenu está lista, la mandamos a llamar para purgar todo
    if (typeof window.cerrarSesionGlobal === "function") {
      await window.cerrarSesionGlobal();
    } else {
      // Respaldo atómico clásico si se ejecuta de forma aislada
      await supabase.auth.signOut();
      localStorage.removeItem("emailUsuario");
      window.location.href = "/";
    }
  };
}

// Inicialización asíncrona del panel
renderDashboard();