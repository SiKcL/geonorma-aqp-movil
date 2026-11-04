package com.geonormaaqp.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(
        name = "PdfDownload",
        permissions = {
                @Permission(
                        alias = "notifications",
                        strings = { Manifest.permission.POST_NOTIFICATIONS }
                )
        }
)
public class PdfDownloadPlugin extends Plugin {

    private static final String CHANNEL_ID = "geonorma_downloads";

    // =========================================
    // SOLICITAR PERMISO DE NOTIFICACIONES
    // =========================================

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {

        if (Build.VERSION.SDK_INT < 33 ||
                ContextCompat.checkSelfPermission(
                        getContext(),
                        Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED) {

            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        requestPermissionForAlias(
                "notifications",
                call,
                "notificationPermissionCallback"
        );
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {

        boolean granted = Build.VERSION.SDK_INT < 33 ||
                ContextCompat.checkSelfPermission(
                        getContext(),
                        Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED;

        JSObject result = new JSObject();
        result.put("granted", granted);

        call.resolve(result);
    }

    // =========================================
    // DESCARGAR PDF A DOWNLOADS
    // =========================================

    @PluginMethod
    public void savePdf(PluginCall call) {

        String fileName = call.getString("fileName");

        if (fileName == null ||
                !fileName.matches("[a-zA-Z0-9._-]+\\.pdf")) {

            call.reject("Nombre de archivo no válido.");
            return;
        }

        if (Build.VERSION.SDK_INT < 29) {
            call.reject("Se requiere Android 10 o superior.");
            return;
        }

        getActivity().runOnUiThread(() -> {

            Uri fileUri = null;

            try {

                ContentValues values = new ContentValues();
                values.put(
                        MediaStore.Downloads.DISPLAY_NAME,
                        fileName
                );
                values.put(
                        MediaStore.Downloads.MIME_TYPE,
                        "application/pdf"
                );
                values.put(
                        MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS + "/GeoNorma AQP"
                );
                values.put(
                        MediaStore.Downloads.IS_PENDING,
                        1
                );

                fileUri = getContext()
                        .getContentResolver()
                        .insert(
                                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                                values
                        );

                if (fileUri == null) {
                    throw new Exception("No se pudo crear el archivo.");
                }

                // Los PDF están incluidos dentro de la aplicación.
                String ruta = "public/documentos/normativa/" + fileName;

                try (
                        InputStream input = getContext()
                                .getAssets()
                                .open(ruta);

                        OutputStream output = getContext()
                                .getContentResolver()
                                .openOutputStream(fileUri)
                ) {

                    if (output == null) {
                        throw new Exception("No se pudo escribir el PDF.");
                    }

                    byte[] buffer = new byte[8192];
                    int cantidad;

                    while ((cantidad = input.read(buffer)) != -1) {
                        output.write(buffer, 0, cantidad);
                    }

                    output.flush();
                }

                ContentValues terminado = new ContentValues();
                terminado.put(MediaStore.Downloads.IS_PENDING, 0);

                getContext()
                        .getContentResolver()
                        .update(fileUri, terminado, null, null);

                crearNotificacion(fileUri, fileName);

                JSObject result = new JSObject();
                result.put("fileName", fileName);
                result.put("uri", fileUri.toString());
                result.put("downloaded", true);

                call.resolve(result);

            } catch (Exception error) {

                if (fileUri != null) {
                    getContext().getContentResolver().delete(
                            fileUri,
                            null,
                            null
                    );
                }

                call.reject(
                        "No se pudo descargar el PDF: " + error.getMessage(),
                        error
                );
            }
        });
    }

    // =========================================
    // NOTIFICACIÓN DE DESCARGA COMPLETADA
    // =========================================

    private void crearNotificacion(Uri uri, String fileName) {

        if (
                Build.VERSION.SDK_INT >= 33 &&
                        ContextCompat.checkSelfPermission(
                                getContext(),
                                Manifest.permission.POST_NOTIFICATIONS
                        ) != PackageManager.PERMISSION_GRANTED
        ) {
            return;
        }

        NotificationManager manager =
                (NotificationManager) getContext()
                        .getSystemService(getContext().NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= 26) {

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Descargas de documentos",
                    NotificationManager.IMPORTANCE_DEFAULT
            );

            manager.createNotificationChannel(channel);
        }

        Intent abrir = new Intent(Intent.ACTION_VIEW);
        abrir.setDataAndType(uri, "application/pdf");
        abrir.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                getContext(),
                fileName.hashCode(),
                abrir,
                PendingIntent.FLAG_UPDATE_CURRENT |
                        PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder notification =
                new NotificationCompat.Builder(getContext(), CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.stat_sys_download_done)
                        .setContentTitle("Descarga completada")
                        .setContentText(fileName)
                        .setContentIntent(pendingIntent)
                        .setAutoCancel(true)
                        .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        manager.notify(fileName.hashCode(), notification.build());
    }
}