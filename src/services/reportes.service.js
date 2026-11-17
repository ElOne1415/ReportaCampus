/* ==========================================================
   ReportaCampus · Servicio de reportes
   ----------------------------------------------------------
   Única puerta de entrada a los datos de reportes. Sus métodos
   devuelven promesas para que, en la entrega final, se puedan
   reemplazar por llamadas a la API (fetch) sin cambiar las
   páginas que los usan. Cada operación revisa los permisos del
   usuario que la pide, igual que lo hará el backend.

   Respuestas: { ok: true, ... } o { ok: false, error } /
   { ok: false, errores } (errores de validación por campo).
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { generarReportes } from '../data/semilla.js';
import { ESTADOS, PRIORIDADES } from '../models/catalogos.js';
import {
  crearReporte, validarReporte, aplicarEdicion, siguienteCodigo, filtrarReportes,
  validarCambioEstado, aplicarCambioEstado, NOTA_MIN, validarCalificacion
} from '../models/reporte.js';
import { puede, puedeEditarReporte, puedeEliminarReporte, puedeCambiarEstado, puedeComentar, puedeTomar, puedeCalificar, ROLES } from '../models/roles.js';
import { nombreConArea } from '../models/usuario.js';
import { revivirFechas } from './almacenamiento.js';

const SIN_PERMISO = { ok: false, error: 'No tienes permiso para hacer esto.' };
const NO_EXISTE = { ok: false, error: 'El reporte no existe.' };

export function crearServicioReportes({ almacen, usuarios, ahora = new Date() }) {
  let reportes = cargar();

  function cargar() {
    const guardados = almacen.leer(CONFIG.CLAVES.reportes);
    if (Array.isArray(guardados)) return guardados.map(revivirFechas);
    const lista = generarReportes(ahora, CONFIG.SEMILLA, CONFIG.DIAS_SIMULADOS);
    migrarVersion2(lista);
    almacen.escribir(CONFIG.CLAVES.reportes, lista);
    return lista;
  }

  // Los reportes creados con la v0.2 se conservan a nombre de la estudiante de demostración
  function migrarVersion2(lista) {
    const antiguos = almacen.leer(CONFIG.CLAVES.reportesV2);
    if (!Array.isArray(antiguos)) return;
    antiguos.forEach((r) => {
      revivirFechas(r);
      delete r.propio;
      delete r.responsable;
      r.id = siguienteCodigo(lista);
      r.autorId = 'u-007';
      r.responsableId = null;
      lista.unshift(r);
    });
    lista.sort((a, b) => b.creado - a.creado);
    almacen.borrar(CONFIG.CLAVES.reportesV2);
  }

  const guardar = () => almacen.escribir(CONFIG.CLAVES.reportes, reportes);
  const buscar = (id) => reportes.find((x) => x.id === id);

  return {
    ahora,

    async listar(filtros) { return filtros ? filtrarReportes(reportes, filtros) : reportes.slice(); },
    async obtener(id) { return buscar(id) || null; },

    /** Nombre para mostrar del responsable de un reporte. */
    nombreResponsable(r) { return r.responsableId ? nombreConArea(usuarios.obtenerSync(r.responsableId)) : 'Sin asignar'; },

    async crear(datos, usuario) {
      if (!puede(usuario, 'reportes.crear')) return SIN_PERMISO;
      const v = validarReporte(datos);
      if (!v.ok) return v;
      const r = crearReporte(datos, usuario, siguienteCodigo(reportes));
      reportes.unshift(r);
      return { ok: true, reporte: r, guardado: guardar() };
    },

    async editar(id, datos, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeEditarReporte(usuario, r)) return { ok: false, error: 'Solo puedes editar tus reportes mientras están en estado Nuevo.' };
      const v = validarReporte(datos);
      if (!v.ok) return v;
      aplicarEdicion(r, datos, usuario);
      return { ok: true, reporte: r, guardado: guardar() };
    },

    async eliminar(id, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeEliminarReporte(usuario, r)) return { ok: false, error: 'Solo puedes eliminar tus reportes mientras están en estado Nuevo.' };
      reportes = reportes.filter((x) => x !== r);
      return { ok: true, guardado: guardar() };
    },

    /** El administrador asigna (o cambia) el responsable; un reporte Nuevo pasa a En proceso. */
    async asignar(id, responsableId, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puede(usuario, 'reportes.asignar')) return SIN_PERMISO;
      const resp = usuarios.obtenerSync(responsableId);
      if (!resp || resp.rol !== ROLES.RESPONSABLE || !resp.activo) return { ok: false, error: 'Elige un responsable activo.' };
      if (r.estado === ESTADOS.RESUELTO) return { ok: false, error: 'Reabre el reporte antes de cambiar el responsable.' };
      if (r.responsableId === responsableId) return { ok: true, reporte: r, sinCambios: true };
      const ahora2 = new Date();
      const nota = (r.responsableId ? 'Reasignado a ' : 'Asignado a ') + nombreConArea(resp) + '.';
      r.responsableId = responsableId;
      if (r.estado === ESTADOS.NUEVO) r.estado = ESTADOS.EN_PROCESO;
      r.historial.push({ estado: r.estado, fecha: ahora2, nota, por: usuario.nombre });
      return { ok: true, reporte: r, guardado: guardar() };
    },

    /** El responsable toma un reporte nuevo de su categoría; pasa a En proceso a su cargo. */
    async tomar(id, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeTomar(usuario, r)) return { ok: false, error: 'Solo puedes tomar reportes nuevos sin asignar de tus categorías.' };
      r.responsableId = usuario.id;
      r.estado = ESTADOS.EN_PROCESO;
      r.historial.push({ estado: r.estado, fecha: new Date(), nota: 'Tomado por ' + nombreConArea(usuario) + '.', por: usuario.nombre });
      return { ok: true, reporte: r, guardado: guardar() };
    },

    /** El autor califica la solución de 1 a 5, una sola vez. */
    async calificar(id, puntaje, comentario, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeCalificar(usuario, r)) return { ok: false, error: 'Solo el autor puede calificar su reporte resuelto, una vez.' };
      const v = validarCalificacion(puntaje, comentario);
      if (!v.ok) return v;
      const texto = (comentario || '').trim();
      r.calificacion = { puntaje, comentario: texto };
      r.historial.push({ estado: r.estado, fecha: new Date(), nota: 'Calificó la solución con ' + puntaje + ' de 5.' + (texto ? ' «' + texto + '»' : ''), por: usuario.nombre });
      return { ok: true, reporte: r, guardado: guardar() };
    },

    async cambiarEstado(id, estado, nota, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeCambiarEstado(usuario, r)) return SIN_PERMISO;
      if (r.estado === ESTADOS.RESUELTO && usuario.rol !== ROLES.ADMIN) return { ok: false, error: 'Solo el administrador puede reabrir un reporte.' };
      const error = validarCambioEstado(r, estado, nota);
      if (error) return { ok: false, error };
      aplicarCambioEstado(r, estado, nota, usuario);
      return { ok: true, reporte: r, guardado: guardar() };
    },

    async cambiarPrioridad(id, prioridad, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puede(usuario, 'reportes.cambiarPrioridad')) return SIN_PERMISO;
      if (!PRIORIDADES.includes(prioridad)) return { ok: false, error: 'Prioridad no válida.' };
      if (r.prioridad === prioridad) return { ok: true, reporte: r, sinCambios: true };
      r.historial.push({ estado: r.estado, fecha: new Date(), nota: 'Prioridad cambiada de ' + r.prioridad + ' a ' + prioridad + '.', por: usuario.nombre });
      r.prioridad = prioridad;
      return { ok: true, reporte: r, guardado: guardar() };
    },

    async comentar(id, nota, usuario) {
      const r = buscar(id);
      if (!r) return NO_EXISTE;
      if (!puedeComentar(usuario, r)) return SIN_PERMISO;
      const texto = (nota || '').trim();
      if (texto.length < NOTA_MIN) return { ok: false, error: 'Escribe al menos ' + NOTA_MIN + ' caracteres.' };
      r.historial.push({ estado: r.estado, fecha: new Date(), nota: texto, por: usuario.nombre });
      return { ok: true, reporte: r, guardado: guardar() };
    },

    /** ¿El responsable tiene reportes sin resolver? (para no eliminarlo con trabajo pendiente) */
    tieneAbiertosSync(responsableId) {
      return reportes.some((x) => x.responsableId === responsableId && x.estado !== ESTADOS.RESUELTO);
    },

    /** Vuelve a los datos simulados iniciales. */
    async restablecer(usuario) {
      if (!puede(usuario, 'datos.restablecer')) return SIN_PERMISO;
      reportes = generarReportes(new Date(), CONFIG.SEMILLA, CONFIG.DIAS_SIMULADOS);
      return { ok: true, guardado: guardar() };
    }
  };
}
