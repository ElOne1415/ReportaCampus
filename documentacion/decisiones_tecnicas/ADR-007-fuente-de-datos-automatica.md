# ADR-007. Elegir la fuente de datos según quién entrega la página

**Estado:** aceptada · entrega final (v1.0)

## Contexto

La aplicación debía seguir publicada en GitHub Pages, donde no hay backend, y a la vez funcionar con la API cuando se ejecuta `python run.py`. La primera versión detectaba el servidor pidiendo `/api/salud` al cargar. En GitHub Pages esa petición respondía 404 y dejaba un error en la consola en cada visita.

## Decisión

- `CONFIG.FUENTE_DATOS` acepta `'auto'` (por defecto), `'api'` y `'local'`.
- Flask, al entregar `index.html`, agrega `<meta name="reportacampus-api" content="api">`.
- En modo `'auto'`, el frontend usa la API solo si encuentra esa marca, y antes confirma con `/api/salud` que responde. Sin la marca usa los servicios locales sin hacer ninguna petición.
- Con `'api'` y `API_URL` se puede usar un backend en otro dominio (por ejemplo, frontend en GitHub Pages y backend en Render).
- El pie de página dice de dónde vienen los datos.

## Consecuencias

- El mismo `index.html` y el mismo código sirven para los dos despliegues, sin compilar ni cambiar archivos.
- GitHub Pages carga sin errores en la consola.
- Si el backend entrega la página pero la API falla, la aplicación no cambia en silencio a datos locales: muestra el error de conexión en cada acción. Así nadie trabaja creyendo que guarda en el servidor.
