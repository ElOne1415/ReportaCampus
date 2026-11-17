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
    responsable: null,
    autor: autor.nombre,
    propio: true,
    foto: !!d.fotoUrl,
    fotoUrl: d.fotoUrl || null,
    historial: [{ estado: ESTADOS.NUEVO, fecha: ahora, nota: 'Reporte enviado desde la plataforma.', por: autor.nombre }]
  };
}

/** Siguiente código consecutivo (RC-0001, RC-0002, ...). */
export function siguienteCodigo(reportes) {
  const max = reportes.reduce((m, x) => Math.max(m, parseInt(x.id.slice(3), 10) || 0), 0);
  return 'RC-' + String(max + 1).padStart(4, '0');
}

/** Filtra una lista de reportes por texto, estado, categoría y zona. */
export function filtrarReportes(lista, f = {}) {
  const t = (f.texto || '').trim().toLowerCase();
  return lista.filter((x) =>
    (!f.estado || x.estado === f.estado) &&
    (!f.categoria || x.categoria === f.categoria) &&
    (!f.zona || x.ubicacion === f.zona) &&
    (!t || (x.id + ' ' + x.titulo + ' ' + (zonaPorId[x.ubicacion] ? zonaPorId[x.ubicacion].nombre : '')).toLowerCase().includes(t))
  );
}
