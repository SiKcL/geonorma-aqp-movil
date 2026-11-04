
/* =========================================
   GEONORMA AQP - MAPA MOVIL
   Mapa + Buscador de direcciones
   Geocodificacion inversa + Zonificacion
   Bottom Sheet
========================================= */

let mapaMovil = null;
let capaZonificacion = null;
let datosGeoJSON = null;

let zonaSeleccionada = null;
let capaSeleccionada = null;

let marcadorBusqueda = null;
let mapaMovilInicializado = false;

let ubicacionSeleccionada = null;
let geocoderMovil = null;


/* =========================================
   COLORES DE ZONIFICACIÓN
========================================= */

function obtenerColorZona(codigo) {

    const colores = {
        "RDM-1": "#f6e05e",
        "RDM-2": "#ecc94b",
        "ZRE-PN": "#48bb78",
        "I1R": "#ed8936",
        "CIn": "#e53e3e",
        "OU2": "#9f7aea",
        "CM": "#3182ce"
    };

    return colores[codigo] || "#a0aec0";
}


function estiloZona(feature) {

    const codigo = feature.properties?.codigo_zona;

    return {
        fillColor: obtenerColorZona(codigo),
        weight: 1.5,
        opacity: 1,
        color: "#344054",
        fillOpacity: 0.65
    };

}


/* =========================================
   UTILIDADES
========================================= */

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function normalizarTexto(texto) {

    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


/* =========================================
   INFORMACIÓN DE ZONIFICACIÓN
========================================= */

function obtenerInformacionZona(codigo) {

    const info = diccionarioNormativo[codigo];

    if (!info) {

        return {
            codigo,
            nombre: `Zona ${codigo}`,
            usos: "Sin información disponible",
            densidad: "Sin información",
            altura: "Sin información",
            estacionamiento: "Sin información",
            fuente: "Sin información normativa disponible"
        };

    }

    return {

        codigo,

        nombre:
            info.nombre ||
            info.name ||
            `Zona ${codigo}`,

        usos:
            info.usos ||
            info.uses ||
            "Sin información",

        densidad:
            info.densidad ||
            info.density ||
            "Sin información",

        altura:
            info.altura ||
            info.height ||
            "Sin información",

        estacionamiento:
            info.estacionamiento ||
            info.parking ||
            "Sin información",

        fuente:
            info.fuente ||
            info.source ||
            "Sin información"

    };

}


/* =========================================
   BOTTOM SHEET
========================================= */

function cambiarEstadoFicha(estado) {

    const ficha = document.getElementById("zone-sheet");

    if (!ficha) return;

    ficha.classList.remove(
        "collapsed",
        "half",
        "expanded"
    );

    ficha.classList.add(estado);

}


function mostrarFichaCompacta() {
    cambiarEstadoFicha("collapsed");
}


function mostrarFichaExpandida() {
    cambiarEstadoFicha("expanded");
}


function configurarGestosFicha() {

    const handle = document.getElementById("sheet-handle-area");
    const ficha = document.getElementById("zone-sheet");

    if (!handle || !ficha) return;

    let inicioY = 0;
    let ultimoY = 0;
    let arrastrando = false;

    handle.addEventListener("pointerdown", evento => {

        inicioY = evento.clientY;
        ultimoY = evento.clientY;
        arrastrando = true;

        handle.setPointerCapture(evento.pointerId);

    });

    handle.addEventListener("pointermove", evento => {

        if (!arrastrando) return;

        ultimoY = evento.clientY;

    });

    handle.addEventListener("pointerup", () => {

        if (!arrastrando) return;

        arrastrando = false;

        const diferencia = ultimoY - inicioY;

        if (diferencia < -35) {

            mostrarFichaExpandida();

        } else if (diferencia > 35) {

            mostrarFichaCompacta();

        } else {

            if (ficha.classList.contains("expanded")) {
                mostrarFichaCompacta();
            } else {
                mostrarFichaExpandida();
            }

        }

    });

    handle.addEventListener("pointercancel", () => {
        arrastrando = false;
    });

}


/* =========================================
   INFORMACIÓN DE DIRECCIÓN
========================================= */


function obtenerDatosDireccion(resultado) {

    const direccion = resultado?.address || {};

    const calle =
        direccion.road ||
        direccion.pedestrian ||
        direccion.residential ||
        direccion.footway ||
        direccion.path ||
        direccion.highway ||
        direccion.street ||
        resultado?.name ||
        "Calle no identificada";

    const numero = direccion.house_number || "";

    const barrio =
        direccion.neighbourhood ||
        direccion.suburb ||
        direccion.quarter ||
        direccion.city_district ||
        "";

    const ciudad =
        direccion.city ||
        direccion.town ||
        direccion.village ||
        direccion.municipality ||
        "Arequipa";

    return {

        calle: `${calle}${numero ? " " + numero : ""}`,

        barrio,

        ciudad,

        direccionCompleta:
            resultado?.display_name || calle,

        coordenadas: L.latLng(
            Number(resultado.lat),
            Number(resultado.lon)
        )

    };

}

function generarHTMLUbicacion() {

    if (!ubicacionSeleccionada) {
        return "";
    }

    const ubicacion = ubicacionSeleccionada;

    return `

        <div class="location-card">

            <div class="location-card-icon">
                📍
            </div>

            <div class="location-card-content">

                <span class="location-card-label">
                    UBICACIÓN ENCONTRADA
                </span>

                <h3>
                    ${escaparHTML(ubicacion.calle)}
                </h3>

                ${
                    ubicacion.barrio
                        ? `<p>${escaparHTML(ubicacion.barrio)}</p>`
                        : ""
                }

                <span class="location-card-city">
                    ${escaparHTML(ubicacion.ciudad)}
                </span>

                <p class="location-card-full-address">
                    ${escaparHTML(ubicacion.direccionCompleta)}
                </p>

            </div>

        </div>

    `;

}

/* =========================================
   MOSTRAR INFORMACIÓN DE ZONA
========================================= */

function mostrarInformacionZona(codigo, expandir = false) {

    const panel = document.getElementById("zone-details");
    const resumen = document.getElementById("sheet-collapsed-summary");

    if (!panel) return;

    const info = obtenerInformacionZona(codigo);

    zonaSeleccionada = codigo;

    panel.innerHTML = `

        ${generarHTMLUbicacion()}

        <div class="zone-details-header">

            <div>
                <span class="zone-label">ZONA DE ZONIFICACIÓN</span>
                <h2>${escaparHTML(info.codigo)}</h2>
            </div>

            <span class="zone-color"
                style="background:${obtenerColorZona(codigo)}">
            </span>

        </div>

        <h3 class="zone-name">
            ${escaparHTML(info.nombre)}
        </h3>

        <div class="zone-section-title">
            Parámetros normativos
        </div>

        <div class="zone-data-grid">

            <div class="zone-data-item">
                <span>Usos permitidos</span>
                <p>${escaparHTML(info.usos)}</p>
            </div>

            <div class="zone-data-item">
                <span>Densidad</span>
                <p>${escaparHTML(info.densidad)}</p>
            </div>

            <div class="zone-data-item">
                <span>Altura máxima</span>
                <p>${escaparHTML(info.altura)}</p>
            </div>

            <div class="zone-data-item">
                <span>Estacionamiento</span>
                <p>${escaparHTML(info.estacionamiento)}</p>
            </div>

        </div>

        <div class="zone-source">
            <span>Fuente normativa</span>
            <p>${escaparHTML(info.fuente)}</p>
        </div>

        <p class="zone-disclaimer">
            Información referencial. Consulta la documentación
            oficial para verificar las disposiciones aplicables.
        </p>

    `;

    if (resumen) {

        resumen.innerHTML = `

            <span class="sheet-summary-icon">⌖</span>

            <div>
                <strong>${escaparHTML(info.codigo)}</strong>
                <span>
                    ${
                        ubicacionSeleccionada
                            ? escaparHTML(ubicacionSeleccionada.calle)
                            : escaparHTML(info.nombre)
                    }
                </span>
            </div>

            <span class="sheet-chevron">⌃</span>

        `;

    }

    // Si viene de una búsqueda, mostrar los detalles.
    cambiarEstadoFicha(expandir ? "half" : "collapsed");

    console.log("Zona seleccionada:", info);

}


/* =========================================
   MOSTRAR UBICACIÓN SIN ZONIFICACIÓN
========================================= */

function mostrarUbicacionSinZona(expandir = false) {

    const panel = document.getElementById("zone-details");
    const resumen = document.getElementById("sheet-collapsed-summary");

    if (!panel) return;

    zonaSeleccionada = null;
    capaSeleccionada = null;

    if (capaZonificacion) {
        capaZonificacion.resetStyle();
    }

    panel.innerHTML = `

        ${generarHTMLUbicacion()}

        <div class="zone-empty">

            <span class="zone-empty-icon">⌖</span>

            <h3>Sin zonificación identificada</h3>

            <p>
                Se encontró la dirección, pero no se identificó
                un polígono de zonificación para este punto.
            </p>

        </div>

    `;

    if (resumen) {

        resumen.innerHTML = `

            <span class="sheet-summary-icon">📍</span>

            <div>
                <strong>Ubicación encontrada</strong>
                <span>
                    ${escaparHTML(ubicacionSeleccionada?.calle)}
                </span>
            </div>

            <span class="sheet-chevron">⌃</span>

        `;

    }

    cambiarEstadoFicha(expandir ? "half" : "collapsed");

}


/* =========================================
   SELECCIÓN DE POLÍGONOS
========================================= */

function seleccionarZona(
    feature,
    layer,
    mantenerUbicacion = false,
    expandirFicha = false
) {

    const codigo = feature.properties?.codigo_zona;

    if (!codigo) return;

    if (!mantenerUbicacion) {

        ubicacionSeleccionada = null;

        if (marcadorBusqueda && mapaMovil) {
            mapaMovil.removeLayer(marcadorBusqueda);
            marcadorBusqueda = null;
        }

    }

    if (capaZonificacion) {
        capaZonificacion.resetStyle();
    }

    capaSeleccionada = layer;

    layer.setStyle({

        weight: 3,
        color: "#172b4d",
        fillOpacity: 0.9

    });

    if (layer.bringToFront) {
        layer.bringToFront();
    }

    mostrarInformacionZona(codigo, expandirFicha);

    if (mapaMovil) {
        mapaMovil.closePopup();
    }

}


/* =========================================
   DETECTAR ZONA POR COORDENADAS
========================================= */

function buscarZonaPorCoordenadas(latlng) {

    if (
        !datosGeoJSON ||
        typeof turf === "undefined"
    ) {
        return null;
    }

    const punto = turf.point([
        latlng.lng,
        latlng.lat
    ]);

    for (const feature of datosGeoJSON.features) {

        try {

            if (turf.booleanPointInPolygon(punto, feature)) {
                return feature;
            }

        } catch (error) {

            console.warn(
                "No se pudo evaluar un polígono:",
                error
            );

        }

    }

    return null;

}


function seleccionarZonaEncontrada(feature) {

    if (!feature || !capaZonificacion) return;

    let capaEncontrada = null;

    capaZonificacion.eachLayer(layer => {

        if (layer.feature === feature) {
            capaEncontrada = layer;
        }

    });

    if (!capaEncontrada) {

        console.warn("No se encontró la capa correspondiente al polígono.");
        return;

    }

    // Mantener la dirección buscada y abrir la ficha.
    seleccionarZona(feature, capaEncontrada, true, true);

}



/* =========================================
   BUSCAR ZONA POR CÓDIGO O NOMBRE
========================================= */

function buscarZonaPorTexto(consulta) {

    if (
        !capaZonificacion ||
        !datosGeoJSON ||
        typeof diccionarioNormativo === "undefined"
    ) {
        return false;
    }

    const texto = normalizarTexto(consulta);

    if (!texto) return false;

    const coincidencia = Object.entries(diccionarioNormativo)
        .find(([codigo, info]) => {

            const codigoNormalizado = normalizarTexto(codigo);

            const nombreNormalizado = normalizarTexto(
                info.nombre || info.name || ""
            );

            return (
                codigoNormalizado === texto ||
                codigoNormalizado.includes(texto) ||
                nombreNormalizado.includes(texto)
            );

        });

    if (!coincidencia) return false;

    const codigoEncontrado = coincidencia[0];

    const capasEncontradas = [];

    capaZonificacion.eachLayer(layer => {

        const codigoPoligono = normalizarTexto(
            layer.feature?.properties?.codigo_zona
        );

        if (codigoPoligono === normalizarTexto(codigoEncontrado)) {
            capasEncontradas.push(layer);
        }

    });

    if (capasEncontradas.length === 0) return false;

    // La búsqueda de una zona por código no es una dirección.
    ubicacionSeleccionada = null;

    if (marcadorBusqueda && mapaMovil) {
        mapaMovil.removeLayer(marcadorBusqueda);
        marcadorBusqueda = null;
    }

    const grupo = L.featureGroup(capasEncontradas);
    const limites = grupo.getBounds();

    if (limites.isValid()) {

        mapaMovil.fitBounds(limites, {

            padding: [45, 45],
            maxZoom: 17

        });

    }

    seleccionarZona(
        capasEncontradas[0].feature,
        capasEncontradas[0]
    );

    const estado = document.getElementById("map-status");

    if (estado) {
        estado.textContent = `Zona encontrada: ${codigoEncontrado}`;
    }

    return true;

}


/* =========================================
   CARGAR GEOJSON
========================================= */

async function cargarZonificacion() {

    const estado = document.getElementById("map-status");

    try {

        if (estado) {
            estado.textContent = "Cargando zonificación...";
        }

        const respuesta = await fetch(
            "poligonos_zonificacion_web.geojson"
        );

        if (!respuesta.ok) {

            throw new Error(
                `Error HTTP ${respuesta.status} al cargar GeoJSON`
            );

        }

        datosGeoJSON = await respuesta.json();

        capaZonificacion = L.geoJSON(datosGeoJSON, {

            style: estiloZona,

            onEachFeature: (feature, layer) => {

                layer.on({

                    click: () => {
                        seleccionarZona(feature, layer);
                    },

                    mouseover: evento => {

                        evento.target.setStyle({

                            weight: 2.5,
                            fillOpacity: 0.85

                        });

                    },

                    mouseout: evento => {

                        if (evento.target === capaSeleccionada) {

                            evento.target.setStyle({

                                weight: 3,
                                color: "#172b4d",
                                fillOpacity: 0.9

                            });

                        } else {

                            capaZonificacion.resetStyle(evento.target);

                        }

                    }

                });

            }

        }).addTo(mapaMovil);

        const limites = capaZonificacion.getBounds();

        if (limites.isValid()) {

            mapaMovil.fitBounds(limites, {

                padding: [25, 25]

            });

        }

        if (estado) {

            estado.textContent =
                `${datosGeoJSON.features.length} elementos cargados`;

            estado.parentElement?.classList.remove("map-status-error");
            estado.parentElement?.classList.add("map-status-success");

        }

        console.log(
            "GeoJSON cargado:",
            datosGeoJSON.features.length,
            "elementos"
        );

    } catch (error) {

        console.error(
            "Error cargando zonificación:",
            error
        );

        if (estado) {

            estado.textContent = "Error al cargar la zonificación";

            estado.parentElement?.classList.remove("map-status-success");
            estado.parentElement?.classList.add("map-status-error");

        }

    }

}


/* =========================================
   BUSCAR DIRECCIÓN
========================================= */


function configurarBuscador() {

    const formulario = document.getElementById("map-search-form");
    const input = document.getElementById("map-search-input");

    if (!formulario || !input) return;

    // Evitar registrar el evento más de una vez.
    if (formulario.dataset.configurado === "true") return;

    formulario.dataset.configurado = "true";

    formulario.addEventListener("submit", async evento => {

        evento.preventDefault();

        const consulta = input.value.trim();

        if (!consulta) return;

        input.blur();

        const estado = document.getElementById("map-status");

        const actualizarEstado = (mensaje, error = false) => {

            if (!estado) return;

            estado.textContent = mensaje;

            estado.parentElement?.classList.toggle(
                "map-status-error",
                error
            );

            estado.parentElement?.classList.toggle(
                "map-status-success",
                !error
            );

        };

        // Primero comprobamos si se ingresó un código de zona.
        if (buscarZonaPorTexto(consulta)) {
            return;
        }

        actualizarEstado("Buscando dirección...");

        try {

            // Mismos parámetros utilizados por el buscador web.
            const parametros = new URLSearchParams({

                q: consulta,
                format: "jsonv2",
                addressdetails: "1",
                countrycodes: "pe",
                viewbox: "-71.80,-16.20,-71.30,-16.60",
                bounded: "1",
                limit: "5",
                "accept-language": "es"

            });

            const url =
                `https://nominatim.openstreetmap.org/search?${parametros}`;

            // Evitar que la aplicación quede esperando indefinidamente.
            const controlador = new AbortController();

            const temporizador = setTimeout(() => {
                controlador.abort();
            }, 12000);

            let respuesta;

            try {

                respuesta = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    signal: controlador.signal
                });

            } finally {

                clearTimeout(temporizador);

            }

            if (!respuesta.ok) {

                throw new Error(
                    `Nominatim respondió con HTTP ${respuesta.status}`
                );

            }

            const resultados = await respuesta.json();

            if (!Array.isArray(resultados) || resultados.length === 0) {

                actualizarEstado(
                    "No se encontró la dirección en Arequipa.",
                    true
                );

                return;

            }

            const resultado = resultados[0];

            // Obtener coordenadas y datos de la dirección.
            const datosDireccion = obtenerDatosDireccion(resultado);

            const ubicacion = datosDireccion.coordenadas;

            if (
                !Number.isFinite(ubicacion.lat) ||
                !Number.isFinite(ubicacion.lng)
            ) {

                throw new Error(
                    "La dirección no devolvió coordenadas válidas."
                );

            }

            // Limpiar marcador anterior.
            if (marcadorBusqueda) {

                mapaMovil.removeLayer(marcadorBusqueda);
                marcadorBusqueda = null;

            }

            // Restaurar los polígonos.
            if (capaZonificacion) {
                capaZonificacion.resetStyle();
            }

            zonaSeleccionada = null;
            capaSeleccionada = null;

            // Guardar dirección encontrada.
            ubicacionSeleccionada = datosDireccion;

            // Centrar el mapa exactamente en la dirección.
            mapaMovil.setView(ubicacion, 18);

            // Crear marcador.
            marcadorBusqueda = L.marker(ubicacion)
                .addTo(mapaMovil);

            marcadorBusqueda.bindPopup(`
                <strong>
                    ${escaparHTML(datosDireccion.calle)}
                </strong>
                <br>
                <small>
                    ${escaparHTML(datosDireccion.ciudad)}
                </small>
            `).openPopup();

            actualizarEstado("Dirección encontrada. Consultando zonificación...");


            // Consultar el polígono donde cae la dirección.
            finalizarBusquedaDireccion(ubicacion, estado);

            // Guardar la búsqueda en el historial.
            guardarConsultaReciente(
                datosDireccion,
                zonaSeleccionada
            );
        } catch (error) {

            console.error("Error buscando dirección:", error);

            if (error.name === "AbortError") {

                actualizarEstado(
                    "La búsqueda tardó demasiado. Intenta nuevamente.",
                    true
                );

            } else {

                actualizarEstado(
                    `Error al buscar dirección: ${error.message}`,
                    true
                );

            }

        }

    });

}



/* =========================================
   FINALIZAR BÚSQUEDA DE DIRECCIÓN
========================================= */

function finalizarBusquedaDireccion(ubicacion, estado) {

    console.log("========== DIAGNÓSTICO DE BÚSQUEDA ==========");
    console.log("Coordenadas:", ubicacion);
    console.log("GeoJSON cargado:", !!datosGeoJSON);
    console.log("Turf disponible:", typeof turf !== "undefined");
    console.log("Cantidad de polígonos:", datosGeoJSON?.features?.length);

    // Evitar conservar una zona de una búsqueda anterior.
    zonaSeleccionada = null;

    if (!datosGeoJSON || typeof turf === "undefined") {

        mostrarUbicacionSinZona(true);

        if (estado) {
            estado.textContent =
                "Dirección encontrada, pero no se pudo consultar la zonificación.";
        }

        console.error("No se puede consultar la zonificación: falta GeoJSON o Turf.");

        console.log("==============================================");

        return;
    }

    const feature = buscarZonaPorCoordenadas(ubicacion);

    console.log("Polígono encontrado:", feature);

    if (feature) {

        const codigo = feature.properties?.codigo_zona;

        console.log("Código de zonificación:", codigo);

        seleccionarZonaEncontrada(feature);

        if (estado) {
            estado.textContent = `Dirección encontrada · Zona ${codigo}`;
        }

    } else {

        console.warn("La dirección no pertenece a ningún polígono del GeoJSON.");

        mostrarUbicacionSinZona(true);

        if (estado) {
            estado.textContent =
                "Dirección encontrada · Sin zonificación identificada";
        }

    }

    console.log("==============================================");
}


/* =========================================
   BOTÓN VOLVER A AREQUIPA
========================================= */

function configurarBotonRecentrar() {

    const boton = document.getElementById(
        "map-recenter-button"
    );

    if (!boton) return;

    boton.addEventListener("click", () => {

        // Volver a visualizar toda la zonificación.
        if (capaZonificacion) {

            const limites = capaZonificacion.getBounds();

            if (limites.isValid()) {

                mapaMovil.fitBounds(limites, {

                    padding: [25, 25]

                });

            }

        } else {

            mapaMovil.setView(
                [-16.409, -71.537],
                13
            );

        }

    });

}


/* =========================================
   LIMPIAR SELECCIÓN
========================================= */

function reiniciarSeleccionZona() {

    zonaSeleccionada = null;
    capaSeleccionada = null;
    ubicacionSeleccionada = null;

    if (capaZonificacion) {
        capaZonificacion.resetStyle();
    }

    if (marcadorBusqueda && mapaMovil) {

        mapaMovil.removeLayer(marcadorBusqueda);
        marcadorBusqueda = null;

    }

    if (mapaMovil) {
        mapaMovil.closePopup();
    }

    const panel = document.getElementById("zone-details");
    const resumen = document.getElementById("sheet-collapsed-summary");

    if (panel) {

        panel.innerHTML = `

            <div class="zone-empty">

                <span class="zone-empty-icon">⌖</span>

                <h3>Selecciona una zona</h3>

                <p>
                    Busca una dirección o toca cualquiera
                    de los polígonos para consultar su información.
                </p>

            </div>

        `;

    }

    if (resumen) {

        resumen.innerHTML = `

            <span class="sheet-summary-icon">⌖</span>

            <div>
                <strong>Explora la zonificación</strong>
                <span>Busca una dirección o selecciona un polígono</span>
            </div>

            <span class="sheet-chevron">⌃</span>

        `;

    }

    const input = document.getElementById("map-search-input");

    if (input) {
        input.value = "";
    }

    cambiarEstadoFicha("collapsed");

}


/* =========================================
   INICIALIZAR MAPA
========================================= */

async function inicializarMapaMovil() {

    if (mapaMovilInicializado) {

        setTimeout(() => {

            mapaMovil.invalidateSize();

        }, 250);

        return;

    }

    const elementoMapa = document.getElementById("mobile-map");

    if (!elementoMapa || typeof L === "undefined") {

        console.error(
            "No se encuentra Leaflet o el contenedor del mapa."
        );

        return;

    }

    if (typeof diccionarioNormativo === "undefined") {

        console.error(
            "No se encuentra el diccionario normativo."
        );

        return;

    }

    mapaMovilInicializado = true;

    mapaMovil = L.map("mobile-map", {

        center: [-16.409, -71.537],
        zoom: 13,
        zoomControl: false

    });

    L.control.zoom({

        position: "bottomright"

    }).addTo(mapaMovil);


    // CARTO VOYAGER

    L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_28ej_1_8591a96deca9a0090a592e74",
        {

            attribution:
                '&copy; OpenStreetMap &copy; CARTO',

            subdomains: "abcd",
            maxZoom: 19

        }
    ).addTo(mapaMovil);


    configurarGestosFicha();
    configurarBuscador();
    configurarBotonRecentrar();

    await cargarZonificacion();

    setTimeout(() => {

        mapaMovil.invalidateSize();

    }, 300);

}


/* =========================================
   RECUPERAR CONSULTA DESDE RECIENTES
========================================= */

async function mostrarConsultaReciente(id) {

    const consulta = obtenerHistorial().find(
        item => item.id === id
    );

    if (!consulta) {
        console.warn("No se encontró la consulta seleccionada.");
        return;
    }

    // Cambiar a la pantalla del mapa.
    switchView("mapa");

    // Esperar a que el mapa y sus polígonos estén disponibles.
    for (let intento = 0; intento < 60; intento++) {

        if (mapaMovil && datosGeoJSON && capaZonificacion) {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));

    }

    if (!mapaMovil || !datosGeoJSON || !capaZonificacion) {

        console.error("El mapa no terminó de cargar.");
        return;

    }

    // Recuperar los datos de la ubicación.
    const ubicacion = L.latLng(
        Number(consulta.lat),
        Number(consulta.lng)
    );

    ubicacionSeleccionada = {

        calle: consulta.calle,
        barrio: consulta.barrio,
        ciudad: consulta.ciudad,
        direccionCompleta: consulta.direccionCompleta,
        coordenadas: ubicacion

    };

    // Limpiar el marcador anterior.
    if (marcadorBusqueda) {

        mapaMovil.removeLayer(marcadorBusqueda);
        marcadorBusqueda = null;

    }

    // Restaurar la ubicación en el mapa.
    mapaMovil.setView(ubicacion, 18);

    marcadorBusqueda = L.marker(ubicacion)
        .addTo(mapaMovil)
        .bindPopup(`
            <strong>${escaparHTML(consulta.calle)}</strong>
        `)
        .openPopup();

    // Buscar nuevamente el polígono correspondiente.
    const feature = buscarZonaPorCoordenadas(ubicacion);

    if (feature) {

        seleccionarZonaEncontrada(feature);

    } else {

        mostrarUbicacionSinZona(true);

    }

    // Actualizar el estado del mapa.
    const estado = document.getElementById("map-status");

    if (estado) {

        estado.textContent = consulta.codigoZona
            ? `Consulta recuperada · Zona ${consulta.codigoZona}`
            : "Consulta recuperada · Sin zonificación identificada";

    }

    // Actualizar el buscador con la dirección recuperada.
    const input = document.getElementById("map-search-input");

    if (input) {
        input.value = consulta.calle;
    }

    setTimeout(() => {
        mapaMovil.invalidateSize();
    }, 250);

}
// =========================================
// RECUPERAR UBICACIÓN DESDE CONSULTAS RECIENTES
// =========================================

async function mostrarConsultaReciente(id) {

    console.log("Recuperando consulta:", id);

    // Buscar la consulta guardada.
    const consultas = obtenerConsultasRecientes();

    const consulta = consultas.find(item => item.id === id);

    if (!consulta) {
        console.error("No se encontró la consulta:", id);
        return;
    }

    // Cambiar a la pestaña del mapa.
    switchView("mapa");

    // Esperar a que el mapa y sus polígonos estén disponibles.
    let intentos = 0;

    while (
        (!mapaMovil || !datosGeoJSON || !capaZonificacion) &&
        intentos < 80
    ) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
    }

    if (!mapaMovil) {
        console.error("El mapa no pudo inicializarse.");
        return;
    }

    // Recuperar las coordenadas.
    const ubicacion = L.latLng(
        Number(consulta.lat),
        Number(consulta.lon)
    );

    // Restaurar información de la dirección.
    ubicacionSeleccionada = {
        calle: consulta.calle,
        barrio: consulta.barrio || "",
        ciudad: consulta.ciudad || "Arequipa",
        direccionCompleta:
            consulta.direccionCompleta || consulta.calle,
        coordenadas: ubicacion
    };

    // Eliminar marcador anterior.
    if (marcadorBusqueda) {
        mapaMovil.removeLayer(marcadorBusqueda);
    }

    // Crear marcador en la ubicación recuperada.
    const nombreSeguro = String(consulta.calle || "Ubicación")
        .replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);

    marcadorBusqueda = L.marker(ubicacion)
        .addTo(mapaMovil)
        .bindPopup(`<strong>${nombreSeguro}</strong>`);

    // Trasladar la cámara a la ubicación.
    mapaMovil.setView(ubicacion, 17);

    marcadorBusqueda.openPopup();

    // Buscar nuevamente su polígono.
    zonaSeleccionada = null;

    const feature = buscarZonaPorCoordenadas(ubicacion);

    if (feature) {

        seleccionarZonaEncontrada(feature);

        console.log(
            "Zona recuperada:",
            feature.properties?.codigo_zona
        );

    } else {

        mostrarUbicacionSinZona(true);

        console.warn("La ubicación no tiene zonificación identificada.");
    }

    // Expandir el panel inferior.
    const sheet = document.getElementById("zone-sheet");

    if (sheet) {
        sheet.classList.remove("collapsed");
        sheet.classList.add("half");
    }

    console.log("Ubicación recuperada correctamente.");
}