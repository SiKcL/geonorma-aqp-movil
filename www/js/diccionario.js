const diccionarioNormativo = {
  "RDM-1": {
    nombre: "Residencial de Densidad Media 1 (RDM-1)",
    usos: ["Residencial Unifamiliar", "Residencial Multifamiliar"],
    densidad: "150 - 300 hab/ha",
    altura: "3 a 4 pisos",
    estacionamiento: "1 cada 2 viviendas",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "RDM-2": {
    nombre: "Residencial de Densidad Media 2 (RDM-2)",
    usos: ["Residencial Multifamiliar", "Conjunto Residencial"],
    densidad: "300 - 450 hab/ha",
    altura: "4 a 6 pisos",
    estacionamiento: "1 cada vivienda",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "ZRE-PN": {
    nombre: "Zona de Reglamentación Especial - Parque Natural",
    usos: ["Protección Ambiental", "Recreación Pasiva", "Investigación"],
    densidad: "No aplica (Restringido)",
    altura: "1 piso (Solo infraestructura de apoyo)",
    estacionamiento: "Según estudio específico",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "I1R": {
    nombre: "Industria Elemental y Complementaria (I1-R)",
    usos: ["Talleres Artesanales", "Pequeña Industria no Molesta"],
    densidad: "No aplica",
    altura: "Según proyecto técnico (Máx. 3 pisos)",
    estacionamiento: "1 por cada 100 m² de área útil",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "CIn": {
    nombre: "Comercio Intensivo (CIn)",
    usos: ["Comercial Metropolitano", "Oficina Administrativa", "Servicios"],
    densidad: "Compatible con RDM/RDH",
    altura: "Según ancho de vía (+1.5(a+r))",
    estacionamiento: "1 cada 50 m² de área comercial",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "OU2": {
    nombre: "Otros Usos / Equipamiento Especial (OU2)",
    usos: ["Equipamiento Institucional", "Educación / Salud", "Servicios Públicos"],
    densidad: "No aplica",
    altura: "Sujeto a diseño arquitectónico y entorno",
    estacionamiento: "Según requerimiento sectorial",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  },
  "CM": {
    nombre: "Comercio Sectorial / Metropolitano (CM)",
    usos: ["Comercio Diario y Vecinal", "Servicios Generales"],
    densidad: "Compatible con uso residencial",
    altura: "Hasta 5 pisos",
    estacionamiento: "1 cada 75 m² de área comercial",
    fuente: "Ordenanza Municipal N.° 975-MPA"
  }
};