import { supabase } from "/src/lib/supabase.js";

let academias = [];
let inscripciones = [];
// Objeto intermedio para acumular las ediciones en memoria del cliente
let cambiosPendientes = {};

// ============= INICIALIZACIÓN =============
async function init() {
  await cargarAcademias();
  await cargarReportes();
  setupEventListeners();
}

// ============= CARGAR ACADEMIAS =============
async function cargarAcademias() {
  try {
    const { data, error } = await supabase
      .from("academias")
      .select("*")
      .order("nombre");

    if (error) throw error;

    academias = data || [];
    cambiosPendientes = {}; // Limpiar cambios pendientes al recargar
    renderAcademias(academias);
    updateStatsCards();
  } catch (err) {
    console.error("Error cargando academias:", err);
    const tbody = document.getElementById("academias-tbody");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-red-600">Error cargando academias</td></tr>';
    }
  }
}

// ============= RENDERIZAR TABLA DE ACADEMIAS =============
function renderAcademias(academiasToShow) {
  const tbody = document.getElementById("academias-tbody");
  if (!tbody) return;

  if (academiasToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No hay academias</td></tr>';
    return;
  }

  tbody.innerHTML = academiasToShow
    .map((academia) => {
      // Verificar si hay un cambio pendiente en memoria para mantener el estado visual correcto
      const estaActiva = cambiosPendientes[academia.id]?.hasOwnProperty('activa') 
        ? cambiosPendientes[academia.id].activa 
        : academia.activa;

      const inscAbierta = cambiosPendientes[academia.id]?.hasOwnProperty('inscripcion_abierta') 
        ? cambiosPendientes[academia.id].inscripcion_abierta 
        : academia.inscripcion_abierta;

      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition text-black">
          <td class="px-6 py-4">
            <p class="font-medium text-gray-900">${academia.nombre}</p>
            <p class="text-xs text-gray-500">${academia.slug || ''}</p>
          </td>
          <td class="px-6 py-4 text-gray-600">${academia.categoria || 'General'}</td>
          <td class="px-6 py-4 text-center">
            <span class="font-semibold text-gray-900">${academia.inscritos_actuales || 0}</span>
          </td>
          <td class="px-6 py-4 text-center text-gray-600">${academia.cupo_maximo || 0}</td>
          
          <td class="px-6 py-4 text-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                ${estaActiva ? "checked" : ""} 
                onchange="window.registrarCambioMemoria('${academia.id}', this.checked, 'activa')"
                class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </td>

          <td class="px-6 py-4 text-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                ${inscAbierta ? "checked" : ""} 
                onchange="window.registrarCambioMemoria('${academia.id}', this.checked, 'inscripcion_abierta')"
                class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
              />
            </label>
          </td>

          <td class="px-6 py-4 text-center font-medium">
            <button 
              onclick="window.verEstudiantes('${academia.id}')"
              class="text-blue-600 hover:text-blue-800 text-sm p-1"
              title="Ver estudiantes"
            >
              👥
            </button>
            <button 
              onclick="window.editarAcademia('${academia.id}')"
              class="text-amber-600 hover:text-amber-800 text-sm p-1 ml-2"
              title="Editar"
            >
              ✎
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ============= REGISTRAR CAMBIO EN MEMORIA LOCAL =============
function registrarCambioMemoria(academiaId, valor, campo) {
  console.log(`[Memoria] Registrando cambio pendiente local: Academia ${academiaId} -> ${campo} = ${valor}`);
  
  if (!cambiosPendientes[academiaId]) {
    cambiosPendientes[academiaId] = {};
  }
  
  cambiosPendientes[academiaId][campo] = valor;

  // Hacer notar visualmente el botón de guardar indicando que hay cambios
  const saveBtn = document.getElementById("save-changes-btn");
  if (saveBtn) {
    saveBtn.classList.remove("bg-gray-400", "hover:bg-gray-500");
    saveBtn.classList.add("bg-amber-600", "hover:bg-amber-700", "animate-pulse");
    saveBtn.innerText = "💾 Guardar Cambios (Pendientes)";
  }
}

// ============= PROCESAR Y ENVIAR LOTES A SUPABASE =============
async function guardarTodosLosCambios() {
  const idsAProcesar = Object.keys(cambiosPendientes);
  
  if (idsAProcesar.length === 0) {
    alert("No has realizado ninguna modificación en los checkboxes de las academias.");
    return;
  }

  const saveBtn = document.getElementById("save-changes-btn");
  if (saveBtn) {
    saveBtn.innerText = "⏳ Sincronizando BD...";
    saveBtn.disabled = true;
  }

  try {
    console.log("[Supabase] Iniciando ráfaga masiva de actualizaciones...");
    
    // Procesar cada academia alterada
    for (const id of idsAProcesar) {
      const payload = cambiosPendientes[id];
      
      const { error } = await supabase
        .from("academias")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    }

    alert("🎉 ¡Todos los cambios han sido guardados con éxito en la base de datos!");
    
    // Restaurar estado normal del botón
    if (saveBtn) {
      saveBtn.classList.remove("bg-amber-600", "hover:bg-amber-700", "animate-pulse");
      saveBtn.classList.add("bg-gray-400", "hover:bg-gray-500");
      saveBtn.innerText = "💾 Guardar Cambios";
      saveBtn.disabled = false;
    }

    // Recargar todo el set para recalcular reportes y estadísticas de forma precisa
    await cargarAcademias();
    await cargarReportes();

  } catch (err) {
    console.error("❌ Error guardando el lote en Supabase:", err);
    alert("Hubo un error al guardar las modificaciones. Por seguridad se restaurará la tabla.");
    await cargarAcademias();
  }
}

// ============= CARGAR REPORTES =============
async function cargarReportes() {
  try {
    const { data: inscripcionesData, error: inscError } = await supabase
      .from("inscripciones")
      .select("academia_id, student_email, estado");

    if (inscError) throw inscError;

    inscripciones = inscripcionesData || [];
    renderReportes();
  } catch (err) {
    console.error("Error cargando reportes:", err);
  }
}

// ============= RENDERIZAR REPORTES =============
function renderReportes() {
  const tbody = document.getElementById("report-inscritos");
  if (!tbody) return;

  const reportData = academias.map((academia) => {
    const inscritos = inscripciones.filter(
      (insc) => insc.academia_id === academia.id && insc.estado === "activa"
    ).length;

    const cupoMaximo = academia.cupo_maximo || 1;
    const porcentaje = ((inscritos / cupoMaximo) * 100).toFixed(1);

    return {
      nombre: academia.nombre,
      inscritos,
      porcentaje,
      cupo: academia.cupo_maximo,
    };
  });

  tbody.innerHTML = reportData
    .map(
      (item) => `
    <tr class="border-b border-gray-100 hover:bg-gray-50 text-black">
      <td class="px-6 py-4 font-medium text-gray-900">${item.nombre}</td>
      <td class="px-6 py-4 text-right">
        <span class="font-semibold text-gray-900">${item.inscritos}</span>
        <span class="text-gray-500">/ ${item.cupo}</span>
      </td>
      <td class="px-6 py-4 text-right">
        <div class="flex items-center justify-end gap-2">
          <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full ${item.porcentaje > 80 ? "bg-red-500" : item.porcentaje > 50 ? "bg-amber-500" : "bg-green-500"}"
              style="width: ${item.porcentaje}%"
            ></div>
          </div>
          <span class="text-sm font-medium text-gray-700 w-12">${item.porcentaje}%</span>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// ============= ACTUALIZAR TARJETAS DE ESTADÍSTICAS =============
function updateStatsCards() {
  const totalAcademiasEl = document.getElementById("total-academias");
  const totalEstudiantesEl = document.getElementById("total-estudiantes");
  const popularAcademiaEl = document.getElementById("popular-academia");
  const popularCountEl = document.getElementById("popular-count");

  if (totalAcademiasEl) totalAcademiasEl.textContent = academias.length;

  if (totalEstudiantesEl) {
    const totalEstudiantes = new Set(
      inscripciones
        .filter((insc) => insc.estado === "activa")
        .map((insc) => insc.student_email)
    ).size;
    totalEstudiantesEl.textContent = totalEstudiantes;
  }

  if (academias.length > 0 && popularAcademiaEl && popularCountEl) {
    const popularAcademia = academias.reduce((prev, current) =>
      (prev.inscritos_actuales || 0) > (current.inscritos_actuales || 0) ? prev : current
    );
    popularAcademiaEl.textContent = popularAcademia.nombre;
    popularCountEl.textContent = `${popularAcademia.inscritos_actuales || 0} inscritos`;
  }
}

// ============= EVENTOS E INTERACCIONES =============
function setupEventListeners() {
  const searchInput = document.getElementById("search-academias");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = academias.filter(
        (a) =>
          (a.categoria && a.categoria.toLowerCase().includes(query)) ||
          (a.nombre && a.nombre.toLowerCase().includes(query))
      );
      renderAcademias(filtered);
    });
  }

  // Evento asignado al nuevo botón de Guardar
  const saveChangesBtn = document.getElementById("save-changes-btn");
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener("click", guardarTodosLosCambios);
  }

  // BUSCA ESTA SECCIÓN DENTRO DE TU FUNCIÓN setupEventListeners() EN `admin-dashboard.js`:

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Si la función global existe, la usamos para limpiar todo el ecosistema
      if (typeof window.cerrarSesionGlobal === "function") {
        await window.cerrarSesionGlobal();
      } else {
        // Fallback clásico de seguridad
        await supabase.auth.signOut();
        localStorage.removeItem("emailUsuario");
        window.location.href = "/";
      }
    });
  }

  const exportBtn = document.getElementById("export-csv");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportCSV);
  }

  const refreshBtn = document.getElementById("refresh-reports");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      await cargarReportes();
      await cargarAcademias();
      alert("Reportes sincronizados desde el servidor.");
    });
  }
}

// ============= EXPORTAR CSV =============
function exportCSV() {
  let csv = "Academia,Inscritos,Cupo maximo,Porcentaje ocupacion\n";

  academias.forEach((academia) => {
    const inscritos = inscripciones.filter(
      (insc) => insc.academia_id === academia.id && insc.estado === "activa"
    ).length;

    const cupo = academia.cupo_maximo || 1;
    const porcentaje = ((inscritos / cupo) * 100).toFixed(1);

    csv += `"${academia.nombre}",${inscritos},${academia.cupo_maximo},${porcentaje}%\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-academias-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ============= CONTROLES COMPLEMENTARIOS =============
function verEstudiantes(academiaId) {
  alert(`Ver estudiantes inscritos para la academia ID: ${academiaId}`);
}

function editarAcademia(academiaId) {
  alert(`Editar parámetros globales para la academia ID: ${academiaId}`);
}

// Exposición global absoluta
window.registrarCambioMemoria = registrarCambioMemoria;
window.verEstudiantes = verEstudiantes;
window.editarAcademia = editarAcademia;

init();