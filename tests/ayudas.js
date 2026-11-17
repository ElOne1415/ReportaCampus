/* Utilidades compartidas por las pruebas */
import { crearServicios } from '../src/services/index.js';
import { almacenMemoria } from '../src/services/almacenamiento.js';

/** Servicios con almacenamiento en memoria (no tocan el navegador). */
export function entorno() {
  const almacen = almacenMemoria();
  const almacenSesion = almacenMemoria();
  return { almacen, almacenSesion, ...crearServicios({ almacen, almacenSesion }) };
}

export const DATOS_VALIDOS = Object.freeze({
  categoria: 'aseo',
  ubicacion: 'biblioteca',
  titulo: 'Baño sin papel ni jabón',
  descripcion: 'El baño del segundo piso no tiene papel desde la mañana.',
  prioridad: 'Media',
  fotoUrl: null
});

// Usuarios de demostración por rol
export const ID = { admin: 'u-001', diana: 'u-002', ana: 'u-003', valentina: 'u-007', santiago: 'u-008', inactivo: 'u-016' };
