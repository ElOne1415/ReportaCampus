/* ==========================================================
   Componente: detalle de un reporte (ventana modal)
   ========================================================== */
import { categoriaPorId, zonaPorId, CLASE_ESTADO } from '../models/catalogos.js';
import { esc, fFechaHora, fNum } from '../utils/formato.js';
import { horasEntre } from '../utils/tiempo.js';
import { estadoHTML, estrellasHTML } from './estado.js';
import { pintarAcciones } from './acciones-reporte.js';

const $ = (id) => document.getElementById(id);

export function iniciarDetalle() {
  const d = $('detalle');
  $('dCerrar').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
}

/** Muestra el detalle de un reporte. */
export function abrirDetalle(x, app) {
  $('dCodigo').innerHTML = x.id + ' ' + estadoHTML(x.estado);
  $('dTitulo').textContent = x.titulo;
  const z = zonaPorId[x.ubicacion];
  const datos = [
    ['Categoría', categoriaPorId[x.categoria].nombre],
    ['Zona', z.nombre + ', ' + z.detalle.toLowerCase()],
    ['Prioridad', x.prioridad],
    ['Responsable', app.reportes.nombreResponsable(x)],
    ['Reportado por', x.autor + (app.usuario && x.autorId === app.usuario.id ? ' (tú)' : '')],
    ['Foto', x.fotoUrl ? 'Adjunta' : (x.foto ? 'Adjunta (dato simulado)' : 'Sin foto')],
    ['Reportado', fFechaHora.format(x.creado)],
    [x.resuelto ? 'Resuelto en' : 'Abierto hace', fNum.format(horasEntre(x.creado, x.resuelto || new Date())) + ' horas']
  ];
  $('dDatos').innerHTML = datos.map((f) => '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>').join('') +
    (x.calificacion ? '<div class="facts__wide"><dt>Calificación del autor</dt><dd>' + estrellasHTML(x.calificacion.puntaje) + ' ' + x.calificacion.puntaje + ' de 5' +
      (x.calificacion.comentario ? ' · «' + esc(x.calificacion.comentario) + '»' : '') + '</dd></div>' : '');
  $('dDesc').textContent = x.descripcion;
  $('dFoto').hidden = !x.fotoUrl;
  if (x.fotoUrl) $('dFotoImg').src = x.fotoUrl; else $('dFotoImg').removeAttribute('src');
  $('dHistorial').innerHTML = x.historial.map((h) =>
    '<li class="history--' + CLASE_ESTADO[h.estado] + '"><strong>' + h.estado + '</strong> <time>' + fFechaHora.format(h.fecha) + '</time><p>' + esc(h.nota) + '</p></li>'
  ).join('');
  pintarAcciones($('dAcciones'), x, app);
  const d = $('detalle');
  if (d.open) return;
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
}

export function cerrarDetalle() {
  const d = $('detalle');
  if (d.open) d.close();
}
