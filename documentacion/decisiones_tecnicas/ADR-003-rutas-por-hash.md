# ADR-003. Navegación por rutas con hash

**Estado:** aceptada · Fase II

## Contexto

En la Fase I todas las secciones estaban en una sola página larga y el menú hacía *scroll* hasta cada una. Con roles, cada usuario debe ver solo sus secciones y no poder entrar a las demás escribiendo la URL.

## Decisión

Un router propio (`src/router.js`) que lee el hash de la URL (`#/reportes?zona=biblioteca`). Cada ruta está declarada en `src/config/rutas.js` con su título, el permiso que exige y su texto en el menú. Antes de mostrar una ruta, `main.js` decide si se puede entrar.

## Razones

- El hash funciona en GitHub Pages sin configurar el servidor (con la History API, recargar una ruta daría error 404).
- Los parámetros en la URL permiten enlazar listas ya filtradas, como el enlace *Asignar* del panel.
- Los botones Atrás y Adelante del navegador funcionan sin código adicional.

## Consecuencias

- Las URLs llevan `#/`. Si en el futuro se publica con un servidor propio, se puede cambiar a la History API modificando solo `router.js`.
- Proteger rutas en el navegador no es seguridad real: la seguridad la darán la API y sus permisos. Por eso los servicios ya revisan permisos (ADR-002).
