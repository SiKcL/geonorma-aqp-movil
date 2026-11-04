# GeoNorma AQP Mobile 📱

**Aplicación móvil de consulta de zonificación y regulación urbana de Arequipa, Perú.**

GeoNorma AQP Mobile es la adaptación de la plataforma web GeoNorma AQP a dispositivos Android. Permite consultar información de zonificación urbana mediante un mapa interactivo, buscar direcciones, revisar consultas recientes y acceder a documentación normativa.

## ✨ Funcionalidades

- **Mapa interactivo:** visualización de polígonos de zonificación urbana.
- **Consulta de zonificación:** selección de zonas y visualización de sus características.
- **Búsqueda de direcciones:** localización de direcciones y consulta de zonificación.
- **Ubicación actual:** consulta de la zona correspondiente a la ubicación del usuario.
- **Consultas recientes:** acceso al historial de ubicaciones consultadas.
- **Documentación normativa:** visualización y descarga de documentos PDF.
- **Interfaz móvil:** navegación y componentes adaptados a dispositivos Android.

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la aplicación |
| CSS3 | Diseño y estilos |
| JavaScript | Lógica e interactividad |
| Leaflet | Mapas interactivos |
| Turf.js | Operaciones geoespaciales |
| GeoJSON | Datos geográficos de zonificación |
| Capacitor 8 | Integración con Android |
| Java | Funcionalidades nativas Android |
| Gradle | Compilación del proyecto |

## 📋 Requisitos del entorno

Para ejecutar el proyecto localmente se necesita:

- Node.js 22 o superior.
- npm.
- Android Studio.
- Android SDK Platform 36.
- Android SDK Build-Tools.
- Android SDK Platform-Tools.
- JDK compatible con la configuración de Android Gradle Plugin. Se recomienda utilizar el JDK integrado de Android Studio.
- Git.

**Importante:** el proyecto incluye Gradle Wrapper, por lo que no es necesario instalar Gradle manualmente.

## 🚀 Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/SiKcL/geonorma-aqp-movil.git
```

Ingresar al directorio:

```bash
cd geonorma-aqp-movil
```

### 2. Instalar dependencias

```bash
npm ci
```

Este comando instala las dependencias definidas en `package-lock.json`.

### 3. Sincronizar Capacitor

```bash
npx cap sync android
```

Este proceso sincroniza los recursos web y los plugins nativos con el proyecto Android.

### 4. Configurar Android Studio

1. Abrir Android Studio.
2. Seleccionar **Open**.
3. Buscar la carpeta `android` dentro del proyecto clonado.
4. Abrir esa carpeta como proyecto.
5. Esperar a que Gradle termine la sincronización.
6. Verificar que Android SDK Platform 36 esté instalado.
7. En la configuración de Gradle, utilizar el JDK integrado de Android Studio si es compatible con la versión de Gradle y Android Gradle Plugin del proyecto.

## ▶️ Ejecutar la aplicación

### Opción A: Emulador Android

1. Abrir Android Studio.
2. Crear o iniciar un dispositivo virtual desde Device Manager.
3. Seleccionar el dispositivo en la barra superior.
4. Presionar **Run ▶**.

### Opción B: Dispositivo Android físico

1. Activar las opciones de desarrollador del teléfono.
2. Habilitar la depuración USB.
3. Conectar el dispositivo al computador.
4. Autorizar la conexión de depuración.
5. Seleccionar el dispositivo en Android Studio.
6. Presionar **Run ▶**.

## 📦 Generar APK de prueba

Desde la terminal, ingresar a la carpeta Android:

```bash
cd android
```

Ejecutar:

```bash
gradlew.bat assembleDebug
```

Al finalizar correctamente, el APK estará disponible en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Este archivo permite instalar y probar la aplicación en dispositivos Android.

## 📁 Estructura del proyecto

```text
geonorma-aqp-movil/
│
├── android/
│   └── Proyecto nativo Android
│
├── www/
│   ├── css/
│   │   ├── app.css
│   │   ├── index.css
│   │   └── mapa.css
│   │
│   ├── documentos/
│   │   └── normativa/
│   │
│   ├── fotos/
│   │
│   ├── js/
│   │   ├── diccionario.js
│   │   ├── index.js
│   │   ├── mapa-mobile.js
│   │   ├── mapa.js
│   │   ├── normativa.js
│   │   └── recientes.js
│   │
│   ├── index.html
│   ├── mapa.html
│   └── poligonos_zonificacion_web.geojson
│
├── capacitor.config.json
├── package.json
├── package-lock.json
└── README.md
```

## 🔧 Desarrollo y actualización

Los archivos web principales se encuentran dentro de `www/`.

Cuando se realicen modificaciones en HTML, CSS o JavaScript, ejecutar desde la raíz:

```bash
npx cap sync android
```

Posteriormente, abrir o actualizar el proyecto Android Studio y ejecutar nuevamente la aplicación.

## 📱 Información de la aplicación

| Propiedad | Valor |
|---|---|
| Nombre | GeoNorma AQP |
| Application ID | `com.geonormaaqp.app` |
| Versión inicial | 1.0.0 |
| Plataforma | Android |
| Capacitor | 8.6.0 |
| SDK mínimo | API 24 |
| SDK objetivo | API 36 |

## 📥 Descargas

Las versiones compiladas de la aplicación se encuentran disponibles en la sección [Releases](https://github.com/SiKcL/geonorma-aqp-movil/releases).

## 🗺️ Proyecto

GeoNorma AQP busca facilitar el acceso a información territorial y normativa urbana de Arequipa, mediante herramientas digitales de consulta geográfica.

**GeoNorma AQP — Zonificación y regulación urbana de Arequipa.**