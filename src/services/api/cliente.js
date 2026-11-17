/* ==========================================================
   ReportaCampus · Cliente HTTP de la API
   ----------------------------------------------------------
   Envuelve fetch: agrega el token, convierte la respuesta a la
   forma { ok, ... } que usan los servicios y traduce los fallos
   de red, el tiempo de espera y la sesión vencida a mensajes
   claros para el usuario.
   ========================================================== */
import { CONFIG } from '../../config/config.js';

export const MENSAJES = Object.freeze({
  red: 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
  tiempo: 'El servidor tardó demasiado en responder. Intenta de nuevo.',
  servidor: 'Ocurrió un error en el servidor. Intenta de nuevo.'
});

/**
 * @param {{ base: string, almacenSesion: object, alVencerSesion?: () => void, fetchFn?: typeof fetch }} op
 */
export function crearCliente({ base, almacenSesion, alVencerSesion = () => {}, fetchFn = globalThis.fetch.bind(globalThis) }) {
  const token = () => (almacenSesion.leer(CONFIG.CLAVES.sesion) || {}).token;

  async function pedir(metodo, ruta, cuerpo) {
    const control = new AbortController();
    const espera = setTimeout(() => control.abort(), CONFIG.API_TIEMPO_MS);
    const cabeceras = { Accept: 'application/json' };
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
    if (token()) cabeceras.Authorization = 'Bearer ' + token();
    let respuesta;
    try {
      respuesta = await fetchFn(base + ruta, { method: metodo, headers: cabeceras, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo), signal: control.signal });
    } catch (e) {
      return { ok: false, error: e.name === 'AbortError' ? MENSAJES.tiempo : MENSAJES.red, red: true };
    } finally {
      clearTimeout(espera);
    }
    let datos = null;
    try { datos = await respuesta.json(); } catch (e) { /* respuesta sin JSON */ }
    if (respuesta.status === 401 && token()) alVencerSesion((datos && datos.error) || 'Tu sesión terminó. Inicia sesión de nuevo.');
    if (datos && typeof datos.ok === 'boolean') return { ...datos, estado: respuesta.status };
    return { ok: false, error: respuesta.status >= 500 ? MENSAJES.servidor : 'Respuesta inesperada del servidor (' + respuesta.status + ').', estado: respuesta.status };
  }

  return {
    get: (ruta) => pedir('GET', ruta),
    post: (ruta, cuerpo = {}) => pedir('POST', ruta, cuerpo),
    put: (ruta, cuerpo = {}) => pedir('PUT', ruta, cuerpo),
    patch: (ruta, cuerpo = {}) => pedir('PATCH', ruta, cuerpo),
    del: (ruta) => pedir('DELETE', ruta)
  };
}

/** Construye "?a=1&b=2" omitiendo los valores vacíos. */
export function consulta(params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false)).toString();
  return q ? '?' + q : '';
}
