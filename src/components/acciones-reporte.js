/* ==========================================================
   Componente: acciones del detalle de un reporte
   ----------------------------------------------------------
   Muestra solo las acciones que el usuario puede hacer sobre
   ese reporte según su rol (ver src/models/roles.js).
   ========================================================== */
import { puedeEditarReporte, puedeEliminarReporte, puedeCambiarEstado, puedeComentar, puedeTomar, puedeCalificar, ROLES } from '../models/roles.js';
import { ESTADOS, PRIORIDADES, categoriaPorId } from '../models/catalogos.js';
import { puede } from '../models/roles.js';
import { esc } from '../utils/formato.js';
import { conBoton } from '../utils/dom.js';
import { NOTA_MIN } from '../models/reporte.js';
import { confirmar } from './confirmar.js';

/** Bloques de acciones: cada uno devuelve { html, conectar(contenedor) } o null. */
const BLOQUES = [bloqueAutor, bloqueCalificar, bloqueTomar, bloqueAdministrador, bloqueAtencion];

function bloqueAutor(x, app) {
  const editar = puedeEditarReporte(app.usuario, x);
  // El administrador elimina desde su propio bloque
  const eliminar = puedeEliminarReporte(app.usuario, x) && x.autorId === app.usuario.id && !puede(app.usuario, 'reportes.eliminar');
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

/** Autor de un reporte resuelto: calificar la solución de 1 a 5. */
function bloqueCalificar(x, app) {
  if (!puedeCalificar(app.usuario, x)) return null;
  return {
    html: '<div class="actions__group"><h4>¿Cómo quedó la solución?</h4>' +
      '<fieldset class="rating" data-campo="puntaje"><legend class="sr-only">Calificación de 1 a 5 estrellas</legend>' +
      [1, 2, 3, 4, 5].map((n) => '<input type="radio" name="puntaje" id="estrella' + n + '" value="' + n + '"><label for="estrella' + n + '" title="' + n + ' de 5">★<span class="sr-only"> ' + n + ' de 5</span></label>').join('') +
      '</fieldset>' +
      '<label class="field"><span>Comentario (opcional)</span><textarea rows="2" maxlength="300" data-campo="comentario" placeholder="Ej. Lo arreglaron el mismo día"></textarea></label>' +
      '<p class="actions__error" data-error-cal hidden></p>' +
      '<div class="actions__row"><button type="button" class="btn btn--primary btn--small" data-accion="calificar">Enviar calificación</button></div></div>',
    conectar(c) {
      const estrellas = Array.from(c.querySelectorAll('.rating label'));
      const pintar = (n) => estrellas.forEach((l, i) => l.classList.toggle('on', i < n));
      c.querySelectorAll('.rating input').forEach((r) => r.addEventListener('change', () => { pintar(+r.value); c.querySelector('[data-error-cal]').hidden = true; }));
      c.querySelector('[data-accion="calificar"]').addEventListener('click', async (e) => {
        const elegido = c.querySelector('.rating input:checked');
        const error = c.querySelector('[data-error-cal]');
        const res = await conBoton(e.currentTarget, 'Enviando…', () => app.reportes.calificar(x.id, elegido ? +elegido.value : 0, c.querySelector('[data-campo="comentario"]').value, app.usuario));
        if (!res.ok) { error.textContent = res.error || Object.values(res.errores || {})[0]; error.hidden = false; return; }
        app.aviso('Gracias por calificar la solución de ' + x.id + '.');
        app.alCambiarReporte(x.id);
      });
    }
  };
}

/** Responsable: tomar un reporte nuevo de su categoría. */
function bloqueTomar(x, app) {
  if (!puedeTomar(app.usuario, x)) return null;
  return {
    html: '<div class="actions__row"><button type="button" class="btn btn--primary btn--small" data-accion="tomar">Tomar reporte</button>' +
      '<span class="actions__note">Es de tu categoría y nadie lo ha tomado. Quedará a tu cargo, en proceso.</span></div>',
    conectar(c) {
      c.querySelector('[data-accion="tomar"]').addEventListener('click', async (e) => {
        const res = await conBoton(e.currentTarget, 'Tomando…', () => app.reportes.tomar(x.id, app.usuario));
        if (!res.ok) { app.avisoError(res.error); return; }
        app.aviso(x.id + ' quedó a tu cargo.');
        app.alCambiarReporte(x.id);
      });
    }
  };
}

/** Administrador: responsable, prioridad y eliminación. */
function bloqueAdministrador(x, app) {
  const u = app.usuario;
  if (!puede(u, 'reportes.asignar')) return null;
  const abierto = x.estado !== ESTADOS.RESUELTO;
  return {
    html: '<div class="actions__group"><h4>Gestión del reporte</h4>' +
      (abierto
        ? '<div class="actions__row actions__row--field"><label class="field"><span>Responsable</span><select data-campo="responsable"><option value="">Elige un responsable</option></select></label>' +
          '<button type="button" class="btn btn--primary btn--small" data-accion="asignar">' + (x.responsableId ? 'Reasignar' : 'Asignar') + '</button></div>'
        : '<p class="actions__note">El reporte está resuelto; para cambiar el responsable primero hay que reabrirlo.</p>') +
      '<div class="actions__row actions__row--field"><label class="field"><span>Prioridad</span><select data-campo="prioridad">' +
      PRIORIDADES.map((p) => '<option' + (p === x.prioridad ? ' selected' : '') + '>' + p + '</option>').join('') + '</select></label>' +
      '<button type="button" class="btn btn--secondary btn--small" data-accion="prioridad">Cambiar prioridad</button>' +
      '<button type="button" class="btn btn--danger btn--small actions__end" data-accion="eliminar">Eliminar reporte</button></div>' +
      '<p class="actions__error" data-error-admin hidden></p></div>',
    async conectar(c) {
      const error = c.querySelector('[data-error-admin]');
      const fallo = (m) => { error.textContent = m; error.hidden = false; };
      const sel = c.querySelector('[data-campo="responsable"]');
      if (sel) {
        const lista = await app.usuarios.responsables(x.categoria);
        sel.insertAdjacentHTML('beforeend', lista.map((r) =>
          '<option value="' + r.id + '"' + (r.id === x.responsableId ? ' selected' : '') + '>' + esc(r.nombre + ' · ' + r.area) +
          (r.categorias.includes(x.categoria) ? ' (atiende ' + categoriaPorId[x.categoria].nombre.toLowerCase() + ')' : '') + '</option>').join(''));
        c.querySelector('[data-accion="asignar"]').addEventListener('click', async () => {
          if (!sel.value) { fallo('Elige un responsable.'); sel.focus(); return; }
          const res = await conBoton(c.querySelector('[data-accion="asignar"]'), 'Asignando…', () => app.reportes.asignar(x.id, sel.value, u));
          if (!res.ok) { fallo(res.error); return; }
          app.aviso(res.sinCambios ? 'El reporte ya tenía ese responsable.' : x.id + ' quedó a cargo de ' + app.reportes.nombreResponsable(res.reporte) + '.');
          app.alCambiarReporte(x.id);
        });
      }
      c.querySelector('[data-accion="prioridad"]').addEventListener('click', async () => {
        const res = await conBoton(c.querySelector('[data-accion="prioridad"]'), null, () => app.reportes.cambiarPrioridad(x.id, c.querySelector('[data-campo="prioridad"]').value, u));
        if (!res.ok) { fallo(res.error); return; }
        app.aviso(res.sinCambios ? 'La prioridad no cambió.' : 'Prioridad de ' + x.id + ': ' + res.reporte.prioridad + '.');
        app.alCambiarReporte(x.id);
      });
      c.querySelector('[data-accion="eliminar"]').addEventListener('click', () => eliminarReporte(x, app));
      c.querySelectorAll('select').forEach((s2) => s2.addEventListener('change', () => { error.hidden = true; }));
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
        const boton = c.querySelector('[data-accion="' + accion + '"]');
        const res = await conBoton(boton, 'Guardando…', () => (accion === 'comentar' ? app.reportes.comentar(x.id, texto, u)
          : app.reportes.cambiarEstado(x.id, accion === 'resolver' ? ESTADOS.RESUELTO : ESTADOS.EN_PROCESO, texto, u)));
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
  if (!res.ok) { app.avisoError(res.error); return; }
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
