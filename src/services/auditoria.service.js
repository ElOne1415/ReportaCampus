/* ==========================================================
   ReportaCampus · Registro de actividad (modo local)
   ----------------------------------------------------------
   Guarda en el navegador las últimas acciones que cambiaron
   datos, con la misma forma que GET /api/auditoria. Los
   servicios no lo llaman directamente: index.js envuelve sus
   métodos con conAuditoria().
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { puede } from '../models/roles.js';

const MAXIMO = 300;

export function crearServicioAuditoria({ almacen }) {
  let registros = almacen.leer(CONFIG.CLAVES.auditoria) || [];

  return {
    registrar(usuario, accion, entidad, entidadId, detalle = '') {
      registros.unshift({ fecha: new Date().toISOString(), usuario: usuario ? usuario.nombre : 'Sistema', accion, entidad, entidadId, detalle: String(detalle).slice(0, 300) });
      registros = registros.slice(0, MAXIMO);
      almacen.escribir(CONFIG.CLAVES.auditoria, registros);
    },
    async listar(limite = 50, usuario) {
      if (usuario !== undefined && !puede(usuario, 'auditoria.ver')) throw new Error('No tienes permiso para ver la actividad.');
      return registros.slice(0, limite);
    },
    vaciar() { registros = []; almacen.borrar(CONFIG.CLAVES.auditoria); }
  };
}

/**
 * Qué registrar por cada método. Cada regla recibe los argumentos y la
 * respuesta, y devuelve [acción, entidad, id, detalle].
 */
const REGLAS = {
  reportes: {
    crear: (a, r) => ['crear', 'reporte', r.reporte.id, r.reporte.titulo],
    editar: (a) => ['editar', 'reporte', a[0]],
    eliminar: (a) => ['eliminar', 'reporte', a[0]],
    asignar: (a, r) => (r.sinCambios ? null : ['asignar', 'reporte', a[0], r.reporte.historial.at(-1).nota]),
    tomar: (a) => ['tomar', 'reporte', a[0]],
    cambiarEstado: (a) => [a[1] === 'Resuelto' ? 'resolver' : 'reabrir', 'reporte', a[0], a[2] || ''],
    cambiarPrioridad: (a, r) => (r.sinCambios ? null : ['prioridad', 'reporte', a[0], a[1]]),
    calificar: (a) => ['calificar', 'reporte', a[0], String(a[1])]
  },
  usuarios: {
    crear: (a, r) => ['crear', 'usuario', r.usuario.id, r.usuario.nombre + ' (' + r.usuario.rol + ')'],
    editar: (a, r) => ['editar', 'usuario', a[0], r.usuario.nombre],
    cambiarActivo: (a, r) => [a[1] ? 'activar' : 'desactivar', 'usuario', a[0], r.usuario.nombre],
    eliminar: (a) => ['eliminar', 'usuario', a[0]]
  }
};

/** Devuelve el servicio con los métodos de REGLAS[nombre] registrando cada cambio exitoso. */
export function conAuditoria(nombre, servicio, auditoria) {
  Object.entries(REGLAS[nombre]).forEach(([metodo, regla]) => {
    const original = servicio[metodo].bind(servicio);
    servicio[metodo] = async (...args) => {
      const res = await original(...args);
      if (res && res.ok) {
        const datos = regla(args, res);
        if (datos) auditoria.registrar(args[args.length - 1], ...datos);
      }
      return res;
    };
  });
  return servicio;
}
