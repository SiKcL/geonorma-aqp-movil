
/* =========================================
   GEONORMA AQP - NORMATIVA
   Descargas nativas Android
========================================= */

(() => {
    "use strict";

    const botonToggle = document.getElementById("toggle-documentos");

    const documentosExtra = document.querySelectorAll(
        "[data-documento-extra]"
    );

    const tarjetas = document.querySelectorAll(
        ".normativa-card[data-pdf]"
    );

    // =========================================
    // VER MÁS / VER MENOS
    // =========================================

    if (botonToggle) {

        botonToggle.addEventListener("click", () => {

            const expandir =
                botonToggle.getAttribute("aria-expanded") !== "true";

            documentosExtra.forEach(documento => {
                documento.hidden = !expandir;
            });

            botonToggle.setAttribute(
                "aria-expanded",
                String(expandir)
            );

            const texto = botonToggle.querySelector("span");

            if (texto) {
                texto.textContent = expandir
                    ? "📁 Ver menos documentos"
                    : `📁 Ver más documentos (${documentosExtra.length})`;
            }
        });
    }

    // =========================================
    // PLUGIN NATIVO
    // =========================================

    const PdfDownload = window.Capacitor?.Plugins?.PdfDownload;

    // =========================================
    // PERMISO DE NOTIFICACIONES AL INICIAR
    // =========================================

    async function solicitarPermisoInicial() {

        // Solo funciona dentro de Android.
        if (!window.Capacitor?.isNativePlatform?.()) return;

        if (!PdfDownload) return;

        const clave = "geonorma_notificaciones_solicitadas";

        // No volver a preguntar si ya se solicitó.
        if (localStorage.getItem(clave) === "true") return;

        try {

            const resultado =
                await PdfDownload.requestNotificationPermission();

            // Registrar que ya se realizó la solicitud.
            localStorage.setItem(clave, "true");

            if (resultado?.granted) {
                console.log("Permiso de notificaciones concedido.");
            } else {
                console.log("Permiso de notificaciones rechazado.");
            }

        } catch (error) {

            console.error(
                "Error solicitando permiso de notificaciones:",
                error
            );
        }
    }

    // Ejecutar al iniciar la aplicación.
    solicitarPermisoInicial();

    // =========================================
    // DESCARGAR DOCUMENTO
    // =========================================

    async function descargarPDF(tarjeta) {

        const fileName = tarjeta.dataset.pdf;

        const botonOriginal = tarjeta.querySelector(
            ".normativa-download"
        );

        if (!PdfDownload) {
            alert("El sistema de descargas no está disponible.");
            console.error("Plugin PdfDownload no encontrado.");
            return;
        }

        tarjeta.disabled = true;
        tarjeta.classList.add("loading");

        if (botonOriginal) {
            botonOriginal.textContent = "…";
        }

        try {

            // Guardar directamente en Download/GeoNorma AQP.
            const resultado = await PdfDownload.savePdf({
                fileName: fileName
            });

            console.log("PDF descargado:", resultado);

            alert(
                "¡Documento descargado correctamente!\n\n" +
                "Ubicación: Descargas / GeoNorma AQP"
            );

        } catch (error) {

            console.error("Error al descargar PDF:", error);

            alert(
                "No se pudo descargar el documento.\n\n" +
                "Inténtalo nuevamente."
            );

        } finally {

            tarjeta.disabled = false;
            tarjeta.classList.remove("loading");

            if (botonOriginal) {
                botonOriginal.textContent = "↓";
            }
        }
    }

    // =========================================
    // EVENTOS
    // =========================================

    tarjetas.forEach(tarjeta => {

        tarjeta.addEventListener("click", () => {
            descargarPDF(tarjeta);
        });

    });

})();
