# ADR-008. Fotos enviadas como data URL y validadas en el servidor

**Estado:** aceptada · entrega final (v1.0)

## Contexto

Desde la v0.2 el navegador reduce la foto a 640 px y la guarda como *data URL* dentro del reporte. Con el servidor había que guardarla en el backend sin cambiar el formulario.

## Decisión

- El frontend sigue enviando la foto como *data URL* en el campo `fotoUrl` de `POST` y `PUT /api/reportes`.
- El backend decodifica la imagen, revisa que sea JPEG, PNG o WebP **por sus primeros bytes** (no por el tipo que dice el navegador), limita el tamaño (`FOTO_MAX_BYTES`), la guarda en `CARPETA_FOTOS` con un nombre aleatorio de 24 caracteres y responde `fotoUrl` con la dirección `/api/fotos/<archivo>`.
- En una edición, `fotoUrl` con la misma dirección conserva la foto, `null` la quita y un *data URL* nuevo la reemplaza (y borra la anterior).

## Consecuencias

- El formulario y la vista previa no cambiaron.
- Un archivo que no sea imagen, aunque se llame `.jpg`, se rechaza con un error por campo.
- La foto viaja en base64 (un 33 % más pesada). Como ya va reducida (unos 50 KB), no afecta el tiempo de respuesta.
- En un servidor sin disco persistente las fotos se pierden al reiniciar. Para producción conviene un almacenamiento de archivos (Azure Blob o S3) detrás de `servicios/fotos.py`.
