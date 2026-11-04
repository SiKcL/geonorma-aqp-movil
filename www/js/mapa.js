// 1. Capas Base (Día / Noche)
const tileDia = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_28ej_1_8591a96deca9a0090a592e74', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

const tileNoche = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_28ej_1_8591a96deca9a0090a592e74', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

// 2. Inicialización del mapa con la capa de día por defecto
const map = L.map('map', {
  center: [-16.409, -71.537],
  zoom: 13,
  layers: [tileDia]
});

// Lógica para alternar el mapa de base
let esModoNoche = false;
const btnToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

btnToggle.addEventListener('click', () => {
  if (esModoNoche) {
    map.removeLayer(tileNoche);
    map.addLayer(tileDia);
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Modo Noche';
    btnToggle.style.background = 'white';
    btnToggle.style.color = '#2d3748';
  } else {
    map.removeLayer(tileDia);
    map.addLayer(tileNoche);
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Modo Día';
    btnToggle.style.background = '#1a202c';
    btnToggle.style.color = 'white';
  }
  esModoNoche = !esModoNoche;
});

// Colores por código de zona
function getColor(codigo) {
  switch (codigo) {
    case 'RDM-1': return '#f6e05e';
    case 'RDM-2': return '#ecc94b';
    case 'ZRE-PN': return '#48bb78';
    case 'I1R':    return '#ed8936';
    case 'CIn':    return '#e53e3e';
    case 'OU2':    return '#9f7aea';
    case 'CM':     return '#3182ce';
    default:       return '#a0aec0';
  }
}

function styleFeature(feature) {
  return {
    fillColor: getColor(feature.properties.codigo_zona),
    weight: 1.5,
    opacity: 1,
    color: '#2d3748',
    fillOpacity: 0.65
  };
}

// La ventana del mapa y la ficha lateral comparten los mismos datos.
function obtenerDatosZona(codigo) {
  const info = diccionarioNormativo[codigo] || {};
  return {
    code: codigo || 'S/C',
    title: info.nombre || `Zona ${codigo || 'desconocida'}`,
    use: Array.isArray(info.usos) ? info.usos.join(', ') : (info.usos || 'Sin información disponible'),
    densidad: info.densidad ?? 'Sin información',
    altura: info.altura ?? 'Sin información',
    areaLibre: info.areaLibre ?? 'Sin información',
    lote: info.lote ?? 'Sin información',
    frente: info.frente ?? 'Sin información',
    estacionamiento: info.estacionamiento ?? 'Sin información',
    fuente: info.fuente || 'Sin información normativa disponible'
  };
}

function notificarZona(codigo) {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'SELECT_ZONE', payload: obtenerDatosZona(codigo) }, window.location.origin);
  }
}

// Cerrar el popup deja la ficha lateral disponible para una nueva selección.
map.on('popupclose', () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'CLEAR_ZONE' }, window.location.origin);
  }
});

function generarContenidoPopup(codigo) {
  const info = obtenerDatosZona(codigo);
  return `
    <div class="info-panel">
      <span class="badge">${codigo || 'S/C'}</span>
      <h4>${info.title}</h4>
      <p><strong>Usos:</strong> ${info.use}</p>
      <p><strong>Densidad:</strong> ${info.densidad}</p>
      <p><strong>Altura Máx:</strong> ${info.altura}</p>
      <p><strong>Estacionamiento:</strong> ${info.estacionamiento}</p>
      <hr style="margin: 6px 0;">
      <small><em>${info.fuente}</em></small>
    </div>
  `;
}

let geoJsonData = null;
let searchMarker = null;

// 3. Carga del GeoJSON local
fetch('poligonos_zonificacion_web.geojson')
  .then(res => res.json())
  .then(data => {
    geoJsonData = data;

    const geoLayer = L.geoJSON(data, {
      style: styleFeature,
      onEachFeature: function (feature, layer) {
        const codigo = feature.properties ? feature.properties.codigo_zona : null;
        layer.bindPopup(generarContenidoPopup(codigo));

        layer.on({
          popupopen: () => notificarZona(codigo),
          mouseover: (e) => e.target.setStyle({ weight: 3, fillOpacity: 0.85 }),
          mouseout: (e) => geoLayer.resetStyle(e.target)
        });
      }
    }).addTo(map);

    map.fitBounds(geoLayer.getBounds());
  })
  .catch(err => console.error('Error al cargar GeoJSON:', err));

// 4. Buscador
const geocoder = L.Control.geocoder({
  defaultMarkGeocode: false,
  placeholder: "Buscar calle...",
  geocoder: L.Control.Geocoder.nominatim({
    geocodingQueryParams: {
      countrycodes: 'pe',
      viewbox: '-71.80,-16.20,-71.30,-16.60',
      bounded: 1,
      limit: 5
    }
  })
}).addTo(map);

geocoder.on('markgeocode', function(e) {
  const latlng = e.geocode.center;

  if (searchMarker) {
    map.removeLayer(searchMarker);
    searchMarker = null;
  }

  searchMarker = L.marker(latlng).addTo(map);
  map.setView(latlng, 16);

  if (geoJsonData) {
    const puntoBusqueda = turf.point([latlng.lng, latlng.lat]);
    let zonaEncontrada = null;

    turf.featureEach(geoJsonData, function(currentFeature) {
      if (turf.booleanPointInPolygon(puntoBusqueda, currentFeature)) {
        zonaEncontrada = currentFeature.properties ? currentFeature.properties.codigo_zona : null;
      }
    });

    const contenido = zonaEncontrada 
      ? `<div style="margin-bottom:6px;"><strong>Ubicación buscada:</strong><br>${e.geocode.name}</div>
         <hr style="margin: 6px 0;">
         ${generarContenidoPopup(zonaEncontrada)}`
      : `<div><strong>Ubicación buscada:</strong><br>${e.geocode.name}</div>
         <hr style="margin: 6px 0;">
         <p style="color:#e53e3e; font-size:12px; margin-top:4px;">⚠️ Dirección fuera de la zona mapeada.</p>`;

    searchMarker.on('popupopen', () => {
      if (zonaEncontrada) notificarZona(zonaEncontrada);
    });
    searchMarker.bindPopup(contenido).openPopup();

    searchMarker.on('popupclose', function() {
      if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
      }
    });
  }
});
