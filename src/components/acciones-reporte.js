/* ==========================================================
   Componente: acciones del detalle de un reporte
   ----------------------------------------------------------
   Muestra solo las acciones que el usuario puede hacer sobre
   ese reporte según su rol (ver src/models/roles.js).
   ========================================================== */
import { puedeEditarReporte, puedeEliminarReporte, puedeCambiarEstado, puedeComentar, ROLES } from '../models/roles.js';
import { ESTADOS } from '../models/catalogos.js';
import { NOTA_MIN } from '../models/reporte.js';
import { confirmar } from './confirmar.js';

/** Bloques de acciones: cada uno devuelve { html, conectar(contenedor) } o null. */
const BLOQUES = [bloqueAutor, bloqueAtencion];

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

/** Responsable asignado o administrador: notas y cambio de estado. */
function bloqueAtencion(x, app) {
  const u = app.usuario;
  const comentar = puedeComentar(u, x);
  const cambiar = puedeCambiarEstado(u, x);
  const resolver = cambiar && x.estado === ESTADOS.EN_PROCESO;
  const reabrir = cambiar && x.estado === ESTADOS.RESUELTO && u.rol === ROLES.ADMIN;
  if (!resolver && !reabrir && !(comentar && x.estado !== ESTADOS.RESUELTO)) return null;
  const ayuda = resolver ? 'Para marcarlo como resuelto describe qué se hizo.' : (reabrir ? 'Explica por qué se reabre.' : '');
  return {
    html: '<div class="actions__group"><h4>Atención del reporte</h4>' +
      '<label class="field"><span>Nota</span><textarea rows="2" maxlength="300" data-campo="nota" placeholder="Ej. Se cambió la chapa y se probó la puerta"></textarea></label>' +
      '<p class="actions__error" data-error hidden></p>' +
      '<div class="actions__row">' +
      (comentar && x.estado !== ESTADOS.RESUELTO ? '<button type="button" class="btn btn--secondary btn--small" data-accion="comentar">Agregar nota</button>' : '') +
      (resolver ? '<button type="button" class="btn btn--primary btn--small" data-accion="resolver">Marcar como resuelto</button>' : '') +
      (reabrir ? '<button type="button" class="btn btn--secondary btn--small" data-accion="reabrir">Reabrir reporte</button>' : '') +
      (ayuda ? '<span class="actions__note">' + ayuda + ' Mínimo ' + NOTA_MIN + ' caracteres.</span>' : '') +
      '</div></div>',
    conectar(c) {
      const nota = c.querySelector('[data-campo="nota"]');
      const error = c.querySelector('[data-error]');
      const ejecutar = async (accion) => {
        const texto = nota.value;
        const res = accion === 'comentar' ? await app.reportes.comentar(x.id, texto, u)
          : await app.reportes.cambiarEstado(x.id, accion === 'resolver' ? ESTADOS.RESUELTO : ESTADOS.EN_PROCESO, texto, u);
        if (!res.ok) { error.textContent = res.error; error.hidden = false; nota.focus(); return; }
        app.aviso(accion === 'comentar' ? 'Nota agregada a ' + x.id + '.' : (accion === 'resolver' ? x.id + ' quedó resuelto.' : x.id + ' se reabrió.'));
        app.alCambiarReporte(x.id);
      };
      nota.addEventListener('input', () => { error.hidden = true; });
      c.querySelectorAll('[data-accion="comentar"], [data-accion="resolver"], [data-accion="reabrir"]').forEach((b) =>
        b.addEventListener('click', () => ejecutar(b.dataset.accion)));
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
