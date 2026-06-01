import { supabase } from "/src/lib/supabase.js";

let academias = [];
let inscripciones = [];
let cambiosPendientes = {};
let academiasFiltradasActualmente = []; // Control para las operaciones masivas
let academiaSeleccionadaIdActual = null; // Guardar referencia de operación del modal

// ============= INICIALIZACIÓN =============
async function init() {
  await cargarAcademias();
  await cargarReportes();
  setupEventListeners();
  setupModalListeners();
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
    academiasFiltradasActualmente = [...academias];
    cambiosPendientes = {}; 
    renderAcademias(academiasFiltradasActualmente);
    updateStatsCards();
  } catch (err) {
    console.error("Error cargando academias:", err);
    const tbody = document.getElementById("academias-tbody");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-red-600">Error cargando academias</td></tr>';
    }
  }
}

// ============= RENDERIZAR TABLA DE ACADEMIAS =============
function renderAcademias(academiasToShow) {
  const tbody = document.getElementById("academias-tbody");
  if (!tbody) return;

  if (academiasToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-gray-500">No hay academias</td></tr>';
    return;
  }

  tbody.innerHTML = academiasToShow
    .map((academia) => {
      const estaActiva = cambiosPendientes[academia.id]?.hasOwnProperty('activa') 
        ? cambiosPendientes[academia.id].activa 
        : academia.activa;

      const inscAbierta = cambiosPendientes[academia.id]?.hasOwnProperty('inscripcion_abierta') 
        ? cambiosPendientes[academia.id].inscripcion_abierta 
        : academia.inscripcion_abierta;

      const permiteCancelacion = cambiosPendientes[academia.id]?.hasOwnProperty('permitir_cancelacion') 
        ? cambiosPendientes[academia.id].permitir_cancelacion 
        : (academia.permitir_cancelacion ?? true);

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

          <td class="px-6 py-4 text-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                ${permiteCancelacion ? "checked" : ""} 
                onchange="window.registrarCambioMemoria('${academia.id}', this.checked, 'permitir_cancelacion')"
                class="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer"
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
  if (!cambiosPendientes[academiaId]) {
    cambiosPendientes[academiaId] = {};
  }
  cambiosPendientes[academiaId][campo] = valor;
  actualizarEstiloBotonGuardar();
}

function actualizarEstiloBotonGuardar() {
  const saveBtn = document.getElementById("save-changes-btn");
  if (saveBtn) {
    saveBtn.classList.remove("bg-gray-400", "hover:bg-gray-500");
    saveBtn.classList.add("bg-amber-600", "hover:bg-amber-700", "animate-pulse");
    saveBtn.innerText = "💾 Guardar Cambios (Pendientes)";
  }
}

// ============= ACCIONES MASIVAS EN MEMORIA =============
function alternarEstadoMasivo(campo) {
  if (academiasFiltradasActualmente.length === 0) return;

  const primerId = academiasFiltradasActualmente[0].id;
  const estadoActualPrimerElemento = cambiosPendientes[primerId]?.hasOwnProperty(campo)
    ? cambiosPendientes[primerId][campo]
    : academiasFiltradasActualmente[0][campo];

  const nuevoEstadoColectivo = !estadoActualPrimerElemento;

  academiasFiltradasActualmente.forEach((academia) => {
    if (!cambiosPendientes[academia.id]) {
      cambiosPendientes[academia.id] = {};
    }
    cambiosPendientes[academia.id][campo] = nuevoEstadoColectivo;
  });

  actualizarEstiloBotonGuardar();
  renderAcademias(academiasFiltradasActualmente);
}

// ============= PROCESAR Y ENVIAR LOTES A SUPABASE =============
async function guardarTodosLosCambios() {
  const idsAProcesar = Object.keys(cambiosPendientes);
  if (idsAProcesar.length === 0) {
    alert("No has realizado ninguna modificación.");
    return;
  }

  const saveBtn = document.getElementById("save-changes-btn");
  if (saveBtn) {
    saveBtn.innerText = "⏳ Sincronizando BD...";
    saveBtn.disabled = true;
  }

  try {
    for (const id of idsAProcesar) {
      const payload = cambiosPendientes[id];
      const { error } = await supabase
        .from("academias")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    }

    alert("🎉 ¡Todos los cambios de las academias se han sincronizado con éxito!");
    
    if (saveBtn) {
      saveBtn.classList.remove("bg-amber-600", "hover:bg-amber-700", "animate-pulse");
      saveBtn.classList.add("bg-gray-400", "hover:bg-gray-500");
      saveBtn.innerText = "💾 Guardar Cambios";
      saveBtn.disabled = false;
    }

    await cargarAcademias();
    await cargarReportes();
  } catch (err) {
    console.error("❌ Error guardando lote:", err);
    alert("Ocurrió un error al guardar. Se restaurarán los valores del servidor.");
    await cargarAcademias();
  }
}

// ============= CONSULTAR ESTUDIANTES (MODAL) =============
async function verEstudiantes(academiaId) {
  academiaSeleccionadaIdActual = academiaId;
  const academiaObj = academias.find(a => a.id === academiaId);
  
  const modal = document.getElementById("modal-estudiantes");
  const modalTitle = document.getElementById("modal-title");
  const modalSubtitle = document.getElementById("modal-subtitle");
  const modalTbody = document.getElementById("modal-tbody");

  if (!modal || !modalTbody) return;

  modal.classList.remove("opacity-0", "pointer-events-none");
  modalTitle.textContent = academiaObj ? academiaObj.nombre : "Cargando Academia";
  modalSubtitle.textContent = "Consultando inscripciones...";
  modalTbody.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-gray-500">Buscando alumnos matriculados...</td></tr>';

  try {
    const { data: inscritos, error: errorInsc } = await supabase
      .from("inscripciones")
      .select("id, student_email, estado") 
      .eq("academia_id", academiaId)
      .eq("estado", "activa");

    if (errorInsc) throw errorInsc;

    if (!inscritos || inscritos.length === 0) {
      modalSubtitle.textContent = "0 alumnos activos";
      modalTbody.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-gray-400">No hay estudiantes activos en esta academia.</td></tr>';
      return;
    }

    const listaEmails = inscritos.map(i => i.student_email);

    const { data: alumnos, error: errorAlumnos } = await supabase
      .from("estudiantes")
      .select("email, nombre, curso")
      .in("email", listaEmails);

    if (errorAlumnos) throw errorAlumnos;

    const listaCompletaCombinada = inscritos.map(insc => {
      const datosAlumno = alumnos.find(a => a.email === insc.student_email);
      return {
        id: insc.id, 
        student_email: insc.student_email,
        estudiantes: datosAlumno ? { nombre: datosAlumno.nombre, curso: datosAlumno.curso } : null
      };
    });

    modalSubtitle.textContent = `${listaCompletaCombinada.length} alumnos matriculados`;
    modalTbody.setAttribute("data-raw-list", JSON.stringify(listaCompletaCombinada));

    modalTbody.innerHTML = listaCompletaCombinada.map((insc) => {
      const nombre = insc.estudiantes?.nombre || "Sin nombre registrado";
      const curso = insc.estudiantes?.curso || "N/A";
      const email = insc.student_email;
      const idInscripcion = insc.id;

      return `
        <tr class="hover:bg-gray-50 text-black">
          <td class="px-4 py-3">
            <p class="font-medium text-gray-900">${nombre}</p>
            <p class="text-xs text-gray-500">${email}</p>
          </td>
          <td class="px-4 py-3 text-gray-600 font-medium">${curso}</td>
          <td class="px-4 py-3 text-center">
            <button 
              onclick="window.darDeBajaEstudiante('${idInscripcion}', '${nombre}', '${email}')"
              class="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-semibold hover:bg-red-100 hover:text-red-700 transition"
            >
              Dar de baja
            </button>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Error al obtener estudiantes:", err);
    modalTbody.innerHTML = '<tr><td colspan="3" class="px-4 py-6 text-center text-red-600">Error al compilar listado.</td></tr>';
  }
}

function editarAcademia(academiaId) {
  verEstudiantes(academiaId);
}

// ============= ACCIÓN: COPIAR INFORMACIÓN AL PORTAPAPELES =============
function copiarInfoAlPortapapeles() {
  const modalTbody = document.getElementById("modal-tbody");
  if (!modalTbody) return;

  const rawDataStr = modalTbody.getAttribute("data-raw-list");
  if (!rawDataStr) {
    alert("No hay datos disponibles para copiar.");
    return;
  }

  const inscritos = JSON.parse(rawDataStr);
  let textoACopiar = "Nombre\tEmail\tCurso\n";
  inscritos.forEach(insc => {
    const nombre = insc.estudiantes?.nombre || "Sin nombre";
    const curso = insc.estudiantes?.curso || "N/A";
    const email = insc.student_email;
    textoACopiar += `${nombre}\t${email}\t${curso}\n`;
  });

  navigator.clipboard.writeText(textoACopiar)
    .then(() => {
      const btn = document.getElementById("btn-copiar-info");
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ ¡Copiado con éxito!";
        btn.classList.replace("bg-blue-50", "bg-green-50");
        btn.classList.replace("text-blue-600", "text-green-600");
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.classList.replace("bg-green-50", "bg-blue-50");
          btn.classList.replace("text-green-600", "text-blue-600");
        }, 2000);
      }
    })
    .catch(err => {
      console.error("Error al copiar al portapapeles:", err);
      alert("No se pudo copiar el contenido automáticamente.");
    });
}

// ============= ACCIÓN CRÍTICA: DAR DE BAJA MEDIANTE EL ENDPOINT API (SOLUCIONADO) =============
async function darDeBajaEstudiante(inscripcionId, nombreEstudiante, studentEmail) {
  const confirmar = confirm(`¿Estás seguro de que deseas dar de baja a ${nombreEstudiante} de esta academia?`);
  if (!confirmar) return;



  try {
    // Usamos el endpoint API que tienes configurado en tu servidor Astro para saltar el RLS del cliente de forma segura.
    const response = await fetch("/api/cancel-inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        academiaId: academiaSeleccionadaIdActual, 
        studentEmail: studentEmail 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al procesar la desvinculación desde el servidor.");
    }

    alert(`Se ha procesado correctamente la baja de ${nombreEstudiante}.`);
    
    // Recargar interfaces locales
    await cargarAcademias();
    await cargarReportes();
    verEstudiantes(academiaSeleccionadaIdActual);

  } catch (err) {
    console.error("Error en flujo de baja:", err);
    alert(err.message || "Ocurrió un inconveniente al tramitar la baja del estudiante.");
  }
}

// ============= CARGAR REPORTES =============
async function cargarReportes() {
  try {
    const { data: inscripcionesData, error: inscError } = await supabase
      .from("inscripciones")
      .select("academia_id, student_email, estado")
      .eq("estado", "activa");

    if (inscError) throw inscError;

    inscripciones = inscripcionesData || [];
    renderReportes();
    updateStatsCards();
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
      (insc) => insc.academia_id === academia.id
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
      inscripciones.map((insc) => insc.student_email)
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
      academiasFiltradasActualmente = academias.filter(
        (a) =>
          (a.categoria && a.categoria.toLowerCase().includes(query)) ||
          (a.nombre && a.nombre.toLowerCase().includes(query))
      );
      renderAcademias(academiasFiltradasActualmente);
    });
  }

  const saveChangesBtn = document.getElementById("save-changes-btn");
  if (saveChangesBtn) {
    saveChangesBtn.addEventListener("click", guardarTodosLosCambios);
  }

  document.getElementById("mass-activa")?.addEventListener("click", () => alternarEstadoMasivo('activa'));
  document.getElementById("mass-inscripcion")?.addEventListener("click", () => alternarEstadoMasivo('inscripcion_abierta'));
  document.getElementById("mass-cancelacion")?.addEventListener("click", () => alternarEstadoMasivo('permitir_cancelacion'));

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (typeof window.cerrarSesionGlobal === "function") {
        await window.cerrarSesionGlobal();
      } else {
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

// ============= CONFIGURACIÓN LISTENERS MODAL =============
function setupModalListeners() {
  const modal = document.getElementById("modal-estudiantes");
  const closeBtn = document.getElementById("close-modal-btn");
  const btnCopiar = document.getElementById("btn-copiar-info");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("opacity-0", "pointer-events-none");
      academiaSeleccionadaIdActual = null;
    });
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("opacity-0", "pointer-events-none");
        academiaSeleccionadaIdActual = null;
      }
    });
  }

  if (btnCopiar) {
    btnCopiar.addEventListener("click", copiarInfoAlPortapapeles);
  }
}

// ============= EXPORTAR DETALLE NOMINAL EN CSV (CON FECHA CORRECTA) =============
// ============= EXPORTAR DETALLE NOMINAL EN CSV (CON FECHA Y HORA EN EL NOMBRE) =============
async function exportCSV() {
  const exportBtn = document.getElementById("export-csv");
  if (exportBtn) {
    exportBtn.innerText = "⏳ Generando reporte...";
    exportBtn.disabled = true;
  }

  try {
    // 1. Traer todas las inscripciones activas con su fecha_inscripcion real
    const { data: todasLasInscripciones, error: errInsc } = await supabase
      .from("inscripciones")
      .select("id, academia_id, student_email, fecha_inscripcion")
      .eq("estado", "activa");

    if (errInsc) throw errInsc;

    if (!todasLasInscripciones || todasLasInscripciones.length === 0) {
      alert("No hay inscripciones activas actualmente para exportar.");
      if (exportBtn) {
        exportBtn.innerText = "📊 Exportar Reporte";
        exportBtn.disabled = false;
      }
      return;
    }

    // 2. Traer la información de todos los estudiantes para cruzar los nombres y cursos
    const { data: todosLosEstudiantes, error: errEst } = await supabase
      .from("estudiantes")
      .select("email, nombre, curso");

    if (errEst) throw errEst;

    // 3. Definir las cabeceras del CSV incluyendo la fecha
    let csv = "Academia,Nombre Estudiante,Email,Curso,Fecha Inscripcion\n";

    // 4. Recorrer cada academia y buscar qué estudiantes pertenecen a ella
    academias.forEach((academia) => {
      const inscripcionesDeEstaAcademia = todasLasInscripciones.filter(
        (insc) => insc.academia_id === academia.id
      );

      inscripcionesDeEstaAcademia.forEach((insc) => {
        const estudianteObj = todosLosEstudiantes.find(
          (est) => est.email === insc.student_email
        );

        const nombreEstudiante = estudianteObj ? estudianteObj.nombre : "Sin registrar";
        const cursoEstudiante = estudianteObj ? estudianteObj.curso : "N/A";
        
        let fechaInscripcion = "N/A";
        if (insc.fecha_inscripcion) {
          fechaInscripcion = insc.fecha_inscripcion.toString().split("T")[0]; 
        }

        csv += `"${academia.nombre.replace(/"/g, '""')}","${nombreEstudiante.replace(/"/g, '""')}","${insc.student_email}","${cursoEstudiante.replace(/"/g, '""')}",${fechaInscripcion}\n`;
      });
    });

    // 5. Obtener la fecha y hora local actual para el nombre del archivo
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    
    const timestampNombre = `${anio}-${mes}-${dia}_${horas}-${minutos}`;

    // 6. Crear el archivo para su descarga automática con firma UTF-8 BOM para Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // El archivo se descargará como: reporte-nominal-academias-2026-06-01_14-52.csv
    a.download = `reporte-nominal-academias-${timestampNombre}.csv`;
    
    a.click();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error("Error al exportar el CSV:", err);
    alert("No se pudo generar el reporte detallado.");
  } finally {
    if (exportBtn) {
      exportBtn.innerText = "📊 Exportar Reporte";
      exportBtn.disabled = false;
    }
  }
}

// Exposición global absoluta
window.registrarCambioMemoria = registrarCambioMemoria;
window.verEstudiantes = verEstudiantes;
window.editarAcademia = editarAcademia;
window.darDeBajaEstudiante = darDeBajaEstudiante;

init();