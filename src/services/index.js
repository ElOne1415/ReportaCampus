/* ==========================================================
   ReportaCampus · Servicios
   Crea los servicios y los conecta entre sí. Las páginas solo
   usan este objeto; para pasar a la API de la entrega final se
   cambia la implementación aquí según CONFIG.FUENTE_DATOS.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { almacenPorDefecto, almacenNavegador, almacenMemoria } from './almacenamiento.js';
import { crearServicioUsuarios } from './usuarios.service.js';
import { crearServicioReportes } from './reportes.service.js';
import { crearServicioAuth } from './auth.service.js';

export function crearServicios({
  almacen = almacenPorDefecto(),
  almacenSesion = (typeof sessionStorage !== 'undefined' ? almacenNavegador(sessionStorage) : almacenMemoria()),
  ahora = new Date()
} = {}) {
  if (CONFIG.FUENTE_DATOS !== 'local') {
    throw new Error('La fuente de datos "' + CONFIG.FUENTE_DATOS + '" se implementa en la entrega final.');
  }
  const usuarios = crearServicioUsuarios({ almacen, ahora });
  const reportes = crearServicioReportes({ almacen, usuarios, ahora });
  usuarios.conectarReportes((id) => reportes.tieneAbiertosSync(id));
  const auth = crearServicioAuth({ almacenSesion, usuarios });
  return { usuarios, reportes, auth };
}
