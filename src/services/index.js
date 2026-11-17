/* ==========================================================
   ReportaCampus · Servicios
   ----------------------------------------------------------
   Crea los servicios y los conecta entre sí. Las páginas solo
   usan este objeto y no saben de dónde vienen los datos:
     - local: navegador (reportes.service.js, usuarios.service.js...)
     - api:   backend Flask (api/*.api.js), misma interfaz
   iniciarServicios() elige según CONFIG.FUENTE_DATOS: en modo
   'auto' usa la API solo si la página trae la marca que agrega
   el backend al entregar index.html.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { almacenPorDefecto, almacenNavegador, almacenMemoria } from './almacenamiento.js';
import { crearServicioUsuarios } from './usuarios.service.js';
import { crearServicioReportes } from './reportes.service.js';
import { crearServicioAuth } from './auth.service.js';
import { crearCliente } from './api/cliente.js';
import { crearReportesApi } from './api/reportes.api.js';
import { crearUsuariosApi } from './api/usuarios.api.js';
import { crearAuthApi } from './api/auth.api.js';

const sesionPorDefecto = () => (typeof sessionStorage !== 'undefined' ? almacenNavegador(sessionStorage) : almacenMemoria());

/** Servicios que guardan todo en el navegador (modo local, pruebas). */
export function crearServicios({
  almacen = almacenPorDefecto(),
  almacenSesion = sesionPorDefecto(),
  ahora = new Date()
} = {}) {
  const usuarios = crearServicioUsuarios({ almacen, ahora });
  const reportes = crearServicioReportes({ almacen, usuarios, ahora });
  usuarios.conectarReportes((id) => reportes.tieneAbiertosSync(id));
  const auth = crearServicioAuth({ almacenSesion, usuarios });
  return { usuarios, reportes, auth, fuente: { modo: 'local' } };
}

/** Servicios que usan la API del backend. */
export function crearServiciosApi({ base, almacenSesion = sesionPorDefecto(), alVencerSesion, fetchFn } = {}) {
  const cliente = crearCliente({ base, almacenSesion, alVencerSesion, fetchFn });
  return {
    reportes: crearReportesApi({ cliente }),
    usuarios: crearUsuariosApi({ cliente }),
    auth: crearAuthApi({ cliente, almacenSesion }),
    fuente: { modo: 'api', base }
  };
}

/** ¿Responde la API en esa dirección? Devuelve los datos de /salud o null. */
async function detectar(base, ms) {
  const control = new AbortController();
  const espera = setTimeout(() => control.abort(), ms);
  try {
    const r = await fetch(base + '/salud', { signal: control.signal, headers: { Accept: 'application/json' } });
    const d = r.ok ? await r.json() : null;
    return d && d.ok ? d : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(espera);
  }
}

/** Cuando la página la entrega el backend, trae <meta name="reportacampus-api">. */
function marcaDelServidor() {
  const m = typeof document !== 'undefined' && document.querySelector('meta[name="reportacampus-api"]');
  return m ? new URL(m.content, document.baseURI).href : null;
}

/**
 * Elige la fuente de datos según CONFIG.FUENTE_DATOS y crea los servicios.
 * @param {{ alVencerSesion?: (mensaje: string) => void }} op
 */
export async function iniciarServicios({ alVencerSesion } = {}) {
  if (CONFIG.FUENTE_DATOS === 'local') return crearServicios();
  // En modo 'auto' solo se usa la API si el backend entregó la página (sin peticiones de prueba en GitHub Pages)
  const marca = marcaDelServidor();
  if (CONFIG.FUENTE_DATOS === 'auto' && !marca) return crearServicios();
  const base = (CONFIG.API_URL || marca || new URL('api', document.baseURI).href).replace(/\/$/, '');
  const salud = await detectar(base, CONFIG.API_TIEMPO_MS);
  if (salud) {
    const s = crearServiciosApi({ base, alVencerSesion });
    s.fuente.baseDatos = salud.baseDatos;
    return s;
  }
  // Hay servidor pero la API no responde: se usa igual para que cada acción muestre el error de conexión
  const s = crearServiciosApi({ base, alVencerSesion });
  s.fuente.sinConexion = true;
  return s;
}
