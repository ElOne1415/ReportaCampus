/* ==========================================================
   ReportaCampus · Modelo de reporte
   Reglas de validación y construcción de un reporte. No usa
   el DOM, así que se puede probar con Node.
   ========================================================== */
import { categoriaPorId, zonaPorId, PRIORIDADES, ESTADOS } from './catalogos.js';

export const LIMITES = Object.freeze({ tituloMin: 8, tituloMax: 80, descMin: 15, descMax: 500 });

/**
 * Valida los datos del formulario de reporte.
 * @returns {{ ok: boolean, errores: Object<string,string> }}
 */
export function validarReporte(d) {
  const errores = {};
  const titulo = (d.titulo || '').trim();
  const descripcion = (d.descripcion || '').trim();
  if (!categoriaPorId[d.categoria]) errores.categoria = 'Elige una categoría.';
  if (!zonaPorId[d.ubicacion]) errores.ubicacion = 'Elige la zona.';
  if (titulo.length < LIMITES.tituloMin) errores.titulo = 'Escribe al menos ' + LIMITES.tituloMin + ' caracteres.';
  else if (titulo.length > LIMITES.tituloMax) errores.titulo = 'Máximo ' + LIMITES.tituloMax + ' caracteres.';
  if (descripcion.length < LIMITES.descMin) errores.descripcion = 'Escribe al menos ' + LIMITES.descMin + ' caracteres.';
  else if (descripcion.length > LIMITES.descMax) errores.descripcion = 'Máximo ' + LIMITES.descMax + ' caracteres.';
  if (!PRIORIDADES.includes(d.prioridad)) errores.prioridad = 'Elige la prioridad.';
  return { ok: Object.keys(errores).length === 0, errores };
}

/** Crea un reporte nuevo en estado Nuevo con su primer registro de historial. */
export function crearReporte(d, autor, id, ahora = new Date()) {
  return {
    id,
    titulo: d.titulo.trim(),
    descripcion: d.descripcion.trim(),
    categoria: d.categoria,
    ubicacion: d.ubicacion,
    prioridad: d.prioridad,
    estado: ESTADOS.NUEVO,
    creado: ahora,
    resuelto: null,
    responsableId: null,
    autorId: autor.id,
    autor: autor.nombre,
    foto: !!d.fotoUrl,
    fotoUrl: d.fotoUrl || null,
    historial: [{ estado: ESTADOS.NUEVO, fecha: ahora, nota: 'Reporte enviado desde la plataforma.', por: autor.nombre }]
  };
}

/** Aplica la edición del autor a un reporte (solo campos del formulario). */
export function aplicarEdicion(r, d, autor, ahora = new Date()) {
  r.titulo = d.titulo.trim();
  r.descripcion = d.descripcion.trim();
  r.categoria = d.categoria;
  r.ubicacion = d.ubicacion;
  r.prioridad = d.prioridad;
  if (d.fotoUrl !== undefined) { r.fotoUrl = d.fotoUrl || null; r.foto = !!d.fotoUrl; }
  r.historial.push({ estado: r.estado, fecha: ahora, nota: 'El autor editó el reporte.', por: autor.nombre });
  return r;
}

// ---------- Cambios de estado ----------

/** Estados a los que se puede pasar desde cada estado. */
export const TRANSICIONES = Object.freeze({
  [ESTADOS.NUEVO]: [ESTADOS.EN_PROCESO],
  [ESTADOS.EN_PROCESO]: [ESTADOS.RESUELTO],
  [ESTADOS.RESUELTO]: [ESTADOS.EN_PROCESO]
});

export const NOTA_MIN = 10;

/**
 * Revisa si un reporte puede pasar al estado `nuevo`.
 * Devuelve un mensaje de error o null si el cambio es válido.
 */
export function validarCambioEstado(r, nuevo, nota) {
  if (!(TRANSICIONES[r.estado] || []).includes(nuevo)) return 'Un reporte ' + r.estado.toLowerCase() + ' no puede pasar a ' + nuevo.toLowerCase() + '.';
  if (nuevo === ESTADOS.EN_PROCESO && !r.responsableId) return 'Asigna un responsable antes de ponerlo en proceso.';
  const texto = (nota || '').trim();
  if (nuevo === ESTADOS.RESUELTO && texto.length < NOTA_MIN) return 'Describe la solución (mínimo ' + NOTA_MIN + ' caracteres).';
  if (r.estado === ESTADOS.RESUELTO && texto.length < NOTA_MIN) return 'Explica por qué se reabre (mínimo ' + NOTA_MIN + ' caracteres).';
  return null;
}

/** Aplica un cambio de estado ya validado y lo registra en el historial. */
export function aplicarCambioEstado(r, nuevo, nota, actor, ahora = new Date()) {
  r.estado = nuevo;
  r.resuelto = nuevo === ESTADOS.RESUELTO ? ahora : null;
  const porDefecto = nuevo === ESTADOS.RESUELTO ? 'Reporte resuelto.' : (nuevo === ESTADOS.EN_PROCESO ? 'Reporte en atención.' : '');
  r.historial.push({ estado: nuevo, fecha: ahora, nota: (nota || '').trim() || porDefecto, por: actor.nombre });
  return r;
}

/** Siguiente código consecutivo (RC-0001, RC-0002, ...). */
export function siguienteCodigo(reportes) {
  const max = reportes.reduce((m, x) => Math.max(m, parseInt(x.id.slice(3), 10) || 0), 0);
  return 'RC-' + String(max + 1).padStart(4, '0');
}

/** Filtra una lista de reportes por texto, estado, categoría, zona, prioridad, autor o responsable. */
export function filtrarReportes(lista, f = {}) {
  const t = (f.texto || '').trim().toLowerCase();
  return lista.filter((x) =>
    (!f.estado || x.estado === f.estado) &&
    (!f.abiertos || x.estado !== ESTADOS.RESUELTO) &&
    (!f.categoria || x.categoria === f.categoria) &&
    (!f.zona || x.ubicacion === f.zona) &&
    (!f.prioridad || x.prioridad === f.prioridad) &&
    (!f.autorId || x.autorId === f.autorId) &&
    (f.responsableId === undefined || f.responsableId === '' || x.responsableId === (f.responsableId === 'ninguno' ? null : f.responsableId)) &&
    (!t || (x.id + ' ' + x.titulo + ' ' + (zonaPorId[x.ubicacion] ? zonaPorId[x.ubicacion].nombre : '')).toLowerCase().includes(t))
  );
}
