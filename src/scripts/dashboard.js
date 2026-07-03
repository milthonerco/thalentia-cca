import { supabase } from "/src/lib/supabase.js";
import { obtenerCupos } from "/src/lib/cupos.js";

let intervalId = null; // Guarda la referencia del temporizador para evitar duplicados

async function renderDashboard() {
  try {
    if (intervalId) clearInterval(intervalId);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/";
      return;
    }

    const email = session.user.email;

    /*
    ===========================================================================
    1. SECCIÓN: INFORMACIÓN DEL USUARIO
    ===========================================================================
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
          <h3 class="text-sm font-bold text-black">
            ${session.user.user_metadata?.full_name || "Usuario"}
          </h3>
          <p class="text-xs text-gray-500">${email}</p>
        </div>
      `;
    }

    /*
    ===========================================================================
    2. SECCIÓN: MIS ACADEMIAS INVENTARIADAS (INSCRITAS)
    ===========================================================================
    */
    // INYECTADO: Solicitamos también la columna 'fecha_cierre' para la evaluación pasiva
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
          activa,
          permitir_cancelacion,
          fecha_cierre
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
      const ahora = new Date();

      misAcademiasEl.innerHTML = misAcademias?.map((item) => {
        if (!item.academias) return "";
        
        // EVALUACIÓN INTELIGENTE DE TIEMPO PARA CANCELACIÓN
        const fCierreRaw = item.academias.fecha_cierre;
        const fechaCierre = fCierreRaw ? new Date(fCierreRaw) : null;
        const tiempoExpirado = fechaCierre && ahora > fechaCierre;

        // Se puede cancelar SI el admin lo permite Y SI el tiempo no ha expirado
        const puedeCancelar = item.academias.permitir_cancelacion && !tiempoExpirado;

        return `
          <div class="border rounded-xl p-3 bg-white flex flex-col gap-2 shadow-sm text-black">
            <b class="text-sm">${item.academias.nombre}</b>
            <span class="text-xs text-gray-500">${item.academias.categoria}</span>
            <div class="flex justify-between items-center mt-2">
              ${puedeCancelar
                ? `
                  <button
                    class="btn-abandonar text-red-600 text-sm font-medium hover:text-red-800 transition-colors"
                    data-id="${item.academias.id}"
                    data-email="${email}"
                    data-fecha-cierre="${fCierreRaw || ''}"
                  >
                    ❌ Salir
                  </button>
                `
                : `<span class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">🔒 Retiros Bloqueados</span>`
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
      }).join("") || "<p class='text-gray-500 italic text-sm col-span-full'>Sin academias vinculadas actualmente</p>";
    }

    /*
    ===========================================================================
    3. SECCIÓN: ACADEMIAS OFERTADAS (DISPONIBLES)
    ===========================================================================
    */
    const academiasBase = await obtenerCupos(email);
    
    const { data: fechasBD } = await supabase
      .from("academias")
      .select("id, fecha_apertura, fecha_cierre");

    const academias = academiasBase.map(a => {
      const match = fechasBD?.find(f => f.id === a.id);
      return {
        ...a,
        fecha_apertura: match?.fecha_apertura || null,
        fecha_cierre: match?.fecha_cierre || null
      };
    });

    const primeraAcademiaConCierre = academias.find(a => a.fecha_cierre);
    const fechaCierreGlobal = primeraAcademiaConCierre ? primeraAcademiaConCierre.fecha_cierre : null;

    inyectarBannerInformativo(fechaCierreGlobal);

    const academiasEl = document.getElementById("academias");

    if (academiasEl) {
      academiasEl.innerHTML = academias.map((a) => {
        return `
          <div
            data-id-academia="${a.id}"
            data-slug="${a.slug}"
            data-ruta="${a.ruta_categoria}"
            data-inscripcion-abierta="${a.inscripcion_abierta}"
            data-cupos-disponibles="${a.cuposDisponibles}"
            data-fecha-apertura="${a.fecha_apertura || ''}"
            data-fecha-cierre="${a.fecha_cierre || ''}"
            class="card-academia rounded-xl p-4 border-2 transition text-black bg-white flex flex-col justify-between"
          >
            <div>
              <b class="text-sm block mb-1">${a.nombre}</b>
              <p class="text-xs text-gray-500 mb-2">${a.categoria}</p>
              
              <div class="text-xs font-semibold text-amber-600 mb-3 clock-container hidden"></div>
            </div>

            <div class="mt-3">
              <span class="badge-estado text-xs font-bold px-2 py-1 rounded-full inline-block mb-1">
                Calculando disponibilidad...
              </span>
              
              <button class="btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl transition duration-200 block text-center disabled:opacity-60 disabled:cursor-not-allowed">
                Entrar
              </button>
            </div>
          </div>
        `;
      }).join("") || "<p class='text-gray-500 italic text-sm col-span-full'>No hay academias disponibles en este momento</p>";

      iniciarProcesamientoTiempoReal(fechaCierreGlobal);
    }

    asignarEventos();

  } catch (err) {
    console.error("Error cargando Dashboard:", err);
  }
}

function inyectarBannerInformativo(fechaCierreISO) {
  let bannerGlobal = document.getElementById("banner-institucional-global");
  const contenedorPrincipal = document.querySelector(".max-w-\\[1100px\\]");
  
  if (!contenedorPrincipal) return;

  if (!bannerGlobal) {
    bannerGlobal = document.createElement("div");
    bannerGlobal.id = "banner-institucional-global";
    contenedorPrincipal.insertBefore(bannerGlobal, contenedorPrincipal.children[1]);
  }

  bannerGlobal.className = "bg-white border-l-4 border-blue-600 rounded-2xl p-5 shadow-sm text-gray-800 flex flex-col gap-3";
  bannerGlobal.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
      <div>
        <h2 class="text-base font-bold text-gray-900 m-0">📢 Información Importante sobre Inscripciones</h2>
        <p class="text-xs text-gray-600 m-0 mt-1">Por favor lee atentamente las indications antes de elegir tu academia.</p>
      </div>
      ${fechaCierreISO ? `
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center min-w-[200px]">
          <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">El proceso cierra en:</span>
          <div id="reloj-banner-general" class="text-sm font-black text-amber-900 font-mono">⏳ Calculando...</div>
        </div>
      ` : ''}
    </div>
    
    <div class="text-sm space-y-2 text-gray-700 leading-relaxed">
      <p>⚠️ Una vez finalizado el contador que se muestra en pantalla, **el sistema cerrará de forma automática las inscripciones** y no se admitirán más registros ni cancelaciones.</p>
      <p>🥋 Es de vital importancia recordar que los estudiantes deben **asistir obligatoriamente portando el uniforme oficial** correspondiente a su academia.</p>
      
     
    </div>
  `;
}

function iniciarProcesamientoTiempoReal(fechaCierreGlobalISO) {
  const fCierreGlobal = fechaCierreGlobalISO ? new Date(fechaCierreGlobalISO) : null;

  const evaluarReglasYActualizarUI = () => {
    const ahora = new Date();
    
    const relojBanner = document.getElementById("reloj-banner-general");
    if (relojBanner && fCierreGlobal) {
      if (ahora > fCierreGlobal) {
        relojBanner.textContent = "🔒 PROCESO FINALIZADO";
        relojBanner.parentElement.className = "bg-red-50 border border-red-200 rounded-xl p-3 text-center min-w-[200px]";
      } else {
        relojBanner.textContent = calcularDiferenciaTiempo(ahora, fCierreGlobal);
      }
    }

    const tarjetas = document.querySelectorAll(".card-academia");
    tarjetas.forEach((card) => {
      const slug = card.dataset.slug;
      const ruta = card.dataset.ruta;
      const interruptorAbiertoAdmin = card.dataset.inscripcionAbierta === "true";
      const cuposDisponibles = parseInt(card.dataset.cuposDisponibles || "0");
      const tieneCupos = cuposDisponibles > 0;
      
      const fechaAperturaStr = card.dataset.fechaApertura;
      const fechaCierreStr = card.dataset.fechaCierre;
      
      const fApertura = fechaAperturaStr ? new Date(fechaAperturaStr) : null;
      const fCierre = fechaCierreStr ? new Date(fechaCierreStr) : null;

      const badge = card.querySelector(".badge-estado");
      const button = card.querySelector(".btn-accion-academia");
      const clockContainer = card.querySelector(".clock-container");

      let estadoFinal = "disponible"; 
      let textoReloj = "";

      if (!interruptorAbiertoAdmin) {
        estadoFinal = "pausado_admin";
      } else if (fApertura && ahora < fApertura) {
        estadoFinal = "proximamente";
        textoReloj = `⏳ Abre en: ${calcularDiferenciaTiempo(ahora, fApertura)}`;
      } else if (fCierre && ahora > fCierre) {
        estadoFinal = "cerrado";
      } else if (!tieneCupos) {
        estadoFinal = "agotado";
      } else if (fCierre) {
        textoReloj = `⏳ Cierra en: ${calcularDiferenciaTiempo(ahora, fCierre)}`;
      }

      card.classList.remove("border-green-500", "bg-green-50", "hover:-translate-y-1", "border-blue-300", "bg-blue-50/50", "border-gray-300", "bg-gray-100", "border-red-400", "bg-red-50/40", "border-red-500", "bg-red-50");

      if (textoReloj) {
        clockContainer.textContent = textoReloj;
        clockContainer.classList.remove("hidden");
      } else {
        clockContainer.classList.add("hidden");
      }

      switch (estadoFinal) {
        case "pausado_admin":
          card.classList.add("border-red-400", "bg-red-50/40");
          badge.className = "badge-estado text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700";
          badge.textContent = "Inscripciones Pausadas";
          button.textContent = "🔒 Cerrado Temporalmente";
          button.disabled = true;
          button.className = "btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed";
          break;
        case "proximamente":
          card.classList.add("border-blue-300", "bg-blue-50/50");
          badge.className = "badge-estado text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700";
          badge.textContent = "Próximamente";
          button.textContent = "🔒 No Iniciado";
          button.disabled = true;
          button.className = "btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed";
          break;
        case "cerrado":
          card.classList.add("border-gray-300", "bg-gray-100");
          badge.className = "badge-estado text-xs font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-600";
          badge.textContent = "Proceso Terminado";
          button.textContent = "🔒 Fuera de Fecha";
          button.disabled = true;
          button.className = "btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed";
          break;
        case "agotado":
          card.classList.add("border-red-500", "bg-red-50");
          badge.className = "badge-estado text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700";
          badge.textContent = "Cupos Agotados";
          button.textContent = "❌ Cupos Agotados";
          button.disabled = true;
          button.className = "btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed";
          break;
        default:
          card.classList.add("border-green-500", "bg-green-50", "hover:-translate-y-1");
          badge.className = "badge-estado text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700";
          badge.textContent = "Cupos Disponible";
          button.textContent = "Ingresar →";
          button.disabled = false;
          button.className = "btn-accion-academia w-full mt-2 text-xs font-bold py-2 px-3 rounded-xl bg-green-600 text-white hover:bg-green-700 cursor-pointer";
          button.onclick = () => { window.location.href = `/categories/${ruta}/${slug}`; };
          break;
      }
    });
  };

  evaluarReglasYActualizarUI();
  intervalId = setInterval(evaluarReglasYActualizarUI, 1000);
}

function calcularDiferenciaTiempo(inicio, fin) {
  const milisegundos = fin.getTime() - inicio.getTime();
  if (milisegundos <= 0) return "0d 00h 00m 00s";
  const dias = Math.floor(milisegundos / (1000 * 60 * 60 * 24));
  const horas = Math.floor((milisegundos % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((milisegundos % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((milisegundos % (1000 * 60)) / 1000);
  return `${dias}d ${String(horas).padStart(2, '0')}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}

/*
===========================================================================
4. SECCIÓN: PROCESAR RETIROS VOLUNTARIOS (SALIR)
===========================================================================
*/
function asignarEventos() {
  document.querySelectorAll(".btn-abandonar").forEach((btn) => {
    btn.onclick = async () => {
      const academiaId = btn.dataset.id;
      const studentEmail = btn.dataset.email;
      const fechaCierreStr = btn.dataset.fechaCierre;

      // VALIDACIÓN INSTANTÁNEA EN CLICK (FRONTEND INTELIGENTE)
      if (fechaCierreStr) {
        const ahora = new Date();
        const fechaCierre = new Date(fechaCierreStr);
        if (ahora > fechaCierre) {
          alert("⏰ El tiempo límite para realizar retiros de esta academia ha expirado.");
          // Convertimos visualmente el bloque para congelarlo
          const parent = btn.parentElement;
          if (parent) {
            parent.innerHTML = `<span class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">🔒 Retiros Bloqueados</span>`;
          }
          return;
        }
      }

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

const logout = document.getElementById("logout");
if (logout) {
  logout.style.display = "inline-flex";
  logout.onclick = async (e) => {
    e.preventDefault();
    if (intervalId) clearInterval(intervalId);
    await supabase.auth.signOut();
    localStorage.removeItem("emailUsuario");
    window.location.href = "/";
  };
}

renderDashboard();
