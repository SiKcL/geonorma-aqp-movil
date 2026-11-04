/* =========================================
   GEONORMA AQP - CONSULTAS RECIENTES
   Almacenamiento local + visualización
========================================= */

const CLAVE_CONSULTAS_RECIENTES = "geonorma_consultas_recientes";
const MAX_CONSULTAS_RECIENTES = 20;


// =========================================
// OBTENER CONSULTAS GUARDADAS
// =========================================

function obtenerConsultasRecientes() {
    try {
        const consultas = localStorage.getItem(
            CLAVE_CONSULTAS_RECIENTES
        );

        return consultas ? JSON.parse(consultas) : [];

    } catch (error) {
        console.error("Error al obtener consultas recientes:", error);
        return [];
    }
}


// =========================================
// GUARDAR UNA NUEVA CONSULTA
// =========================================

function guardarConsultaReciente(datosDireccion, feature) {

    try {
        if (!datosDireccion) return;

        const coordenadas = datosDireccion.coordenadas;

        if (!coordenadas) return;

        const lat = Number(coordenadas.lat);
        const lon = Number(coordenadas.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        // Obtener el código independientemente de cómo venga la selección.
        const propiedades =
            feature?.properties ||
            feature?.feature?.properties ||
            {};

        const codigoZona =
            typeof feature === "string"
                ? feature
                : propiedades.codigo_zona ||
                propiedades.codigo ||
                feature?.codigo_zona ||
                feature?.codigo ||
                null;

        // Consultar información del diccionario.
        const informacionZona = codigoZona &&
            typeof obtenerInformacionZona === "function"
            ? obtenerInformacionZona(codigoZona)
            : null;

        const nombreZona =
            informacionZona?.name ||
            informacionZona?.nombre ||
            propiedades.nombre_zona ||
            propiedades.nombre ||
            null;

        const consulta = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

            calle: datosDireccion.calle || "Ubicación consultada",

            barrio: datosDireccion.barrio || "",

            ciudad: datosDireccion.ciudad || "Arequipa",

            direccionCompleta:
                datosDireccion.direccionCompleta ||
                datosDireccion.calle ||
                "",

            lat,
            lon,

            codigoZona,
            nombreZona,

            fecha: new Date().toISOString()
        };

        let consultas = obtenerConsultasRecientes();

        // Evitar guardar repetidamente la misma ubicación.
        consultas = consultas.filter(item => {
            const mismaUbicacion =
                Math.abs(item.lat - lat) < 0.00001 &&
                Math.abs(item.lon - lon) < 0.00001;

            return !mismaUbicacion;
        });

        // La consulta más reciente aparece primero.
        consultas.unshift(consulta);

        // Mantener un máximo de 20 consultas.
        consultas = consultas.slice(0, MAX_CONSULTAS_RECIENTES);

        localStorage.setItem(
            CLAVE_CONSULTAS_RECIENTES,
            JSON.stringify(consultas)
        );

        console.log("Consulta guardada:", consulta);

        // Actualizar inmediatamente si estamos en Recientes.
        const vistaRecientes = document.getElementById("view-recientes");

        if (vistaRecientes?.classList.contains("active")) {
            renderizarRecientes();
        }

    } catch (error) {
        console.error("Error al guardar consulta reciente:", error);
    }
}


// =========================================
// FORMATEAR FECHA
// =========================================

function formatearFechaReciente(fecha) {

    const fechaConsulta = new Date(fecha);

    if (isNaN(fechaConsulta.getTime())) {
        return "Fecha desconocida";
    }

    return fechaConsulta.toLocaleString("es-PE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// =========================================
// ESCAPAR TEXTO HTML
// =========================================

function escaparHTMLReciente(texto) {

    return String(texto ?? "").replace(/[&<>"']/g, caracter => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entidades[caracter];
    });
}


// =========================================
// MOSTRAR CONSULTAS RECIENTES
// =========================================

function renderizarRecientes() {

    const contenedor = document.getElementById("recent-list");

    if (!contenedor) return;

    const consultas = obtenerConsultasRecientes();

    // Si todavía no hay consultas.
    if (consultas.length === 0) {

        contenedor.className = "empty-state";

        contenedor.innerHTML = `
            <div class="empty-state-icon">◷</div>

            <h3>Aún no tienes consultas</h3>

            <p>
                Las direcciones y zonas que explores
                aparecerán aquí para que puedas consultarlas nuevamente.
            </p>

            <button class="secondary-button"
                    onclick="switchView('mapa')">
                Explorar mapa
            </button>
        `;

        return;
    }

    contenedor.className = "recent-list has-items";

    contenedor.innerHTML = consultas.map(consulta => {

        const id = escaparHTMLReciente(consulta.id);

        const calle = escaparHTMLReciente(consulta.calle);

        const codigoZona = escaparHTMLReciente(
            consulta.codigoZona || "Sin zonificación"
        );

        const nombreZona = escaparHTMLReciente(
            consulta.nombreZona || "No identificada"
        );

        const direccion = escaparHTMLReciente(
            consulta.direccionCompleta
        );

        const barrio = escaparHTMLReciente(
            consulta.barrio || "No disponible"
        );

        const ciudad = escaparHTMLReciente(
            consulta.ciudad || "Arequipa"
        );

        return `
            <article class="recent-card">

                <div class="recent-card-top">

                    <div class="recent-location">

                        <h3>${calle}</h3>

                        <span class="recent-meta">
                            ${codigoZona}
                        </span>

                        <span class="recent-date">
                            ${formatearFechaReciente(consulta.fecha)}
                        </span>

                    </div>

                    <button
                        class="recent-info-button"
                        type="button"
                        data-action="info"
                        data-id="${id}"
                        aria-label="Ver información de la consulta">
                        i
                    </button>

                </div>

                <div class="recent-details" id="details-${id}" hidden>

                    <p>
                        <strong>Zona:</strong> ${nombreZona}
                    </p>

                    <p>
                        <strong>Sector:</strong> ${barrio}
                    </p>

                    <p>
                        <strong>Ciudad:</strong> ${ciudad}
                    </p>

                    <p>
                        <strong>Dirección:</strong> ${direccion}
                    </p>

                    <p>
                        <strong>Coordenadas:</strong>
                        ${consulta.lat.toFixed(5)},
                        ${consulta.lon.toFixed(5)}
                    </p>

                </div>

                <button
                    class="recent-map-link"
                    type="button"
                    data-action="map"
                    data-id="${id}">

                    <span>Ver ubicación en el mapa</span>
                    <span>→</span>

                </button>

            </article>
        `;

    }).join("");

    configurarEventosRecientes();
}


// =========================================
// EVENTOS DE LAS CONSULTAS
// =========================================

function configurarEventosRecientes() {

    const contenedor = document.getElementById("recent-list");

    if (!contenedor || contenedor.dataset.eventsConfigured) return;

    contenedor.dataset.eventsConfigured = "true";

    contenedor.addEventListener("click", event => {

        const boton = event.target.closest("button[data-action]");

        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.action;

        if (accion === "info") {

            const detalles = document.getElementById(`details-${id}`);

            if (detalles) {
                detalles.hidden = !detalles.hidden;
            }

        }

        if (accion === "map") {

            if (typeof mostrarConsultaReciente === "function") {
                mostrarConsultaReciente(id);
            } else {
                console.error(
                    "La función mostrarConsultaReciente no está disponible."
                );
            }

        }

    });
}