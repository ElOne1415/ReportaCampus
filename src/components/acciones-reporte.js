/* ==========================================================
   Componente: acciones del detalle de un reporte
   ----------------------------------------------------------
   Muestra solo las acciones que el usuario puede hacer sobre
   ese reporte según su rol (ver src/models/roles.js).
   ========================================================== */
import { puedeEditarReporte, puedeEliminarReporte } from '../models/roles.js';
import { confirmar } from './confirmar.js';

/** Bloques de acciones: cada uno devuelve { html, conectar(contenedor) } o null. */
const BLOQUES = [bloqueAutor];

function bloqueAutor(x, app) {
  const editar = puedeEditarReporte(app.usuario, x);
  const eliminar = puedeEliminarReporte(app.usuario, x) && x.autorId === app.usuario.id;
  if (!editar && !eliminar) return null;
  return {
    html: '<div class="actions__row">' +
      (editar ? '<button type="button" class="btn btn--secondary btn--small" data-accion="editar">Editar</button>' : '') +
      (eliminar ? '<button type="button" class="btn btn--danger btn--small" data-accion="eliminar-propio">Eliminar reporte</button>' : '') +
      '<span class="actions__note">Disponible mientras el reporte está en estado Nuevo.</span></div>',
    conectar(c) {
      const bEditar = c.querySelector('[data-accion="editar"]');
      if (bEditar) bEditar.addEventListener('click', () => { app.cerrarDetalle(); app.irA('nuevo', { editar: x.id }); });
      const bEliminar = c.querySelector('[data-accion="eliminar-propio"]');
      if (bEliminar) bEliminar.addEventListener('click', () => eliminarReporte(x, app));
    }
  };
}

export async function eliminarReporte(x, app) {
  const ok = await confirmar({ titulo: '¿Eliminar el reporte ' + x.id + '?', mensaje: '«' + x.titulo + '» se borrará de forma permanente.', boton: 'Eliminar' });
  if (!ok) return;
  const res = await app.reportes.eliminar(x.id, app.usuario);
  if (!res.ok) { app.aviso(res.error); return; }
  app.cerrarDetalle();
  app.aviso('Se eliminó el reporte ' + x.id + '.');
  app.recargarPagina();
}

/** Dibuja las acciones permitidas dentro de `contenedor`. */
export function pintarAcciones(contenedor, x, app) {
  const bloques = app.usuario ? BLOQUES.map((b) => b(x, app)).filter(Boolean) : [];
  contenedor.hidden = !bloques.length;
  contenedor.innerHTML = bloques.map((b) => b.html).join('');
  bloques.forEach((b) => b.conectar(contenedor));
}
