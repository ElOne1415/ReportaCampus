# ADR-001. JavaScript con módulos ES, sin framework ni compilación

**Estado:** aceptada · Fase II

## Contexto

En la Fase I el prototipo era un solo archivo `app.js` de unas 470 líneas con funciones globales. Para la Fase II había que agregar roles, cinco páginas nuevas y gestión de usuarios, y la guía pide organización por componentes y separación de responsabilidades. Las opciones eran pasar a React o Vue, o seguir con JavaScript y organizarlo mejor.

## Decisión

Seguir con JavaScript sin framework, dividido en **módulos ES** (`import` / `export`) por capas: `config`, `models`, `data`, `services`, `components`, `pages` y `utils`.

## Razones

- El equipo ya domina HTML, CSS y JavaScript; cambiar de tecnología a mitad del semestre ponía en riesgo la entrega.
- Los módulos ES funcionan en todos los navegadores actuales y en GitHub Pages sin compilación ni `node_modules`.
- La separación en capas da la misma organización que pide la guía: los componentes son funciones que reciben un contenedor y datos.
- Los modelos y servicios no usan el DOM, así que se prueban directo con Node.

## Consecuencias

- Hay que servir la página con un servidor local (Live Server, `python3 -m http.server` o `npm start`), porque los navegadores bloquean los módulos ES abiertos con `file://`. Está explicado en el README.
- El estado de la interfaz se maneja a mano (por ejemplo, `app.estado.filtros`). Si la aplicación crece mucho en la entrega final, se puede evaluar migrar las páginas a un framework; los modelos y servicios se reutilizarían tal cual.
