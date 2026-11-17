# ADR-002. Capa de servicios asíncrona y almacenamiento en el navegador

**Estado:** aceptada · Fase II

## Contexto

Todavía no hay backend; llega en la entrega final. Pero la Fase II necesita crear, editar, asignar y eliminar reportes y usuarios, y que los cambios se conserven al recargar.

## Decisión

1. Toda lectura o escritura de datos pasa por tres servicios (`reportes`, `usuarios`, `auth`) que se crean en `src/services/index.js`.
2. Los métodos son **asíncronos** (`async`) y responden siempre con la misma forma: `{ ok: true, ... }`, `{ ok: false, error }` o `{ ok: false, errores: { campo: mensaje } }`. Es la forma que tendrán las respuestas de la API.
3. Los servicios **revisan los permisos** del usuario en cada operación, además de la interfaz.
4. Por ahora los datos se guardan completos en `localStorage` mediante un adaptador (`almacenamiento.js`). La sesión va en `sessionStorage`.
5. La primera vez se cargan los datos simulados (`src/data/`), y el administrador puede restablecerlos.

## Consecuencias

- En la entrega final se escriben servicios con `fetch` que respetan la misma interfaz, y `CONFIG.FUENTE_DATOS = 'api'` decide cuál usar. Las páginas y componentes no cambian (ver ADR-005).
- Los datos viven en el navegador de cada persona: dos personas no ven los cambios de la otra. Es una limitación conocida de esta fase.
- `localStorage` tiene un límite de unos 5 MB. Por eso las fotos se reducen a 640 px antes de guardarlas; con cientos de fotos se puede llenar. Si `setItem` falla, el servicio responde `guardado: false` y la interfaz lo avisa.
- Los servicios se prueban con un almacén en memoria con la misma interfaz.
