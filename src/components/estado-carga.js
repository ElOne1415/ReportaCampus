/* ==========================================================
   Componente: carga y error de una página
   - Barra superior mientras la página espera datos (solo si
     tarda más de 150 ms, para no parpadear).
   - Si los datos no llegan, un aviso dentro de la página con
     el botón Reintentar.
   ========================================================== */
const $ = (id) => document.getElementById(id);
let pendientes = 0;
let temporizador;

export async function conCarga(promesa) {
  pendientes++;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { if (pendientes) $('cargando').hidden = false; }, 150);
  try {
    return await promesa;
  } finally {
    pendientes = Math.max(0, pendientes - 1);
    if (!pendientes) { clearTimeout(temporizador); $('cargando').hidden = true; }
  }
}

/** Muestra el error en la parte superior de la página indicada. */
export function mostrarErrorPagina(seccion, mensaje, reintentar) {
  quitarErrorPagina(seccion);
  const caja = document.createElement('div');
  caja.className = 'page-error';
  caja.setAttribute('role', 'alert');
  caja.innerHTML = '<div><strong>No se pudieron cargar los datos.</strong><p></p></div><button type="button" class="btn btn--secondary btn--small">Reintentar</button>';
  caja.querySelector('p').textContent = mensaje;
  caja.querySelector('button').addEventListener('click', reintentar);
  const titulo = seccion.querySelector('h1');
  const ancla = titulo ? titulo.closest('.page-head') || titulo : null;
  if (ancla && ancla.parentNode === seccion) ancla.after(caja); else seccion.prepend(caja);
}

export function quitarErrorPagina(seccion) {
  seccion.querySelectorAll(':scope > .page-error').forEach((e) => e.remove());
}
