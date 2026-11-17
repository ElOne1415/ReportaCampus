/* ==========================================================
   ReportaCampus · Router
   ----------------------------------------------------------
   Navegación por hash (#/reportes?zona=biblioteca). Funciona
   en GitHub Pages sin configuración del servidor. Antes de
   mostrar una ruta consulta `puedeEntrar`, que la aplicación
   usa para aplicar los permisos de cada rol.
   ========================================================== */

/** Convierte "#/reportes?zona=x" en { nombre: 'reportes', params: { zona: 'x' } }. */
export function leerHash(hash) {
  const limpio = (hash || '').replace(/^#\/?/, '');
  const [ruta, consulta = ''] = limpio.split('?');
  const params = Object.fromEntries(new URLSearchParams(consulta));
  return { nombre: ruta.split('/')[0] || '', params };
}

/** Construye el hash de una ruta; omite los parámetros vacíos. */
export function crearHash(nombre, params = {}) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  return '#/' + nombre + (q ? '?' + q : '');
}

/**
 * @param {{ rutas: Object<string, {titulo: string}>, inicio: () => string,
 *           puedeEntrar?: (nombre: string) => string|true,
 *           alEntrar: (nombre: string, params: object) => void }} op
 */
export function crearRouter(op) {
  function resolver() {
    let { nombre, params } = leerHash(location.hash);
    if (!op.rutas[nombre]) {
      // Enlaces antiguos (#panel) o rutas que no existen
      const antiguo = (location.hash || '').replace(/^#/, '');
      nombre = op.rutas[antiguo] ? antiguo : op.inicio();
      history.replaceState(null, '', crearHash(nombre, params));
    }
    const permiso = op.puedeEntrar ? op.puedeEntrar(nombre) : true;
    if (permiso !== true) {
      history.replaceState(null, '', crearHash(permiso));
      nombre = permiso;
      params = {};
    }
    op.alEntrar(nombre, params);
  }

  window.addEventListener('hashchange', resolver);

  return {
    iniciar: resolver,
    navegar(nombre, params) {
      const hash = crearHash(nombre, params);
      if (location.hash === hash) resolver(); else location.hash = hash;
    }
  };
}
