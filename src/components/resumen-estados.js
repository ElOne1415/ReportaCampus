/* ==========================================================
   Componente: resumen de reportes por estado
   Cuatro cifras (total y por estado). Si se pasa `alElegir`,
   cada cifra funciona como filtro.
   ========================================================== */
import { LISTA_ESTADOS, CLASE_ESTADO, ESTADOS } from '../models/catalogos.js';

export function pintarResumenEstados(contenedor, lista, { seleccion = '', alElegir = null, etiquetaTotal = 'Total' } = {}) {
  const items = [{ estado: '', etiqueta: etiquetaTotal, n: lista.length }]
    .concat(LISTA_ESTADOS.map((e) => ({ estado: e, etiqueta: e === ESTADOS.NUEVO ? 'Nuevos' : (e === ESTADOS.RESUELTO ? 'Resueltos' : e), n: lista.filter((x) => x.estado === e).length })));
  const tag = alElegir ? 'button' : 'div';
  contenedor.innerHTML = items.map((it) =>
    '<' + tag + (alElegir ? ' type="button" aria-pressed="' + (seleccion === it.estado) + '"' : '') + ' class="summary__item' + (it.estado ? ' summary__item--' + CLASE_ESTADO[it.estado] : '') + '" data-estado="' + it.estado + '">' +
    '<span class="summary__label">' + it.etiqueta + '</span><span class="summary__value">' + it.n + '</span></' + tag + '>'
  ).join('');
  if (alElegir && !contenedor.dataset.escucha) {
    contenedor.dataset.escucha = '1';
    contenedor.addEventListener('click', (e) => {
      const b = e.target.closest('[data-estado]');
      if (b) contenedor.$alElegir(b.dataset.estado);
    });
  }
  contenedor.$alElegir = alElegir;
}
