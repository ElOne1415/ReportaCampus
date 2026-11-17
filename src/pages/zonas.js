/* ==========================================================
   Página: Zonas del campus
   Tarjetas con los reportes abiertos de cada espacio.
   ========================================================== */
import { ZONAS, ESTADOS } from '../models/catalogos.js';
import { $ } from '../utils/dom.js';
import { plural } from '../utils/formato.js';

export function crearPaginaZonas(app) {
  return {
    id: 'zonas',
    montar() {
      $('#zonas-lista').addEventListener('click', (e) => {
        const z = e.target.closest('[data-zona]');
        if (z) app.irA('reportes', { zona: z.dataset.zona });
      });
    },
    async mostrar() {
      const reportes = await app.reportes.listar();
      $('#zonas-lista').innerHTML = ZONAS.map((u) => {
        const abiertos = reportes.filter((x) => x.ubicacion === u.id && x.estado !== ESTADOS.RESUELTO);
        const urgentes = abiertos.filter((x) => x.prioridad === 'Alta').length;
        const nivel = abiertos.length === 0 ? 'ok' : (urgentes ? 'alta' : 'media');
        const texto = abiertos.length === 0 ? 'Sin reportes abiertos'
          : plural(abiertos.length, 'reporte abierto', 'reportes abiertos') + (urgentes ? ', ' + plural(urgentes, 'urgente', 'urgentes') : '');
        return '<button type="button" class="zone zone--' + nivel + '" data-zona="' + u.id + '">' +
          '<span class="zone__name">' + u.nombre + '</span><span class="zone__detail">' + u.detalle + '</span>' +
          '<span class="zone__count">' + abiertos.length + '</span><span class="zone__text">' + texto + '</span></button>';
      }).join('');
    }
  };
}
