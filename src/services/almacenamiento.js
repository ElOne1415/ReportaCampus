/* ==========================================================
   ReportaCampus · Almacenamiento
   ----------------------------------------------------------
   Adaptador sobre localStorage. Los servicios reciben un
   almacén con la misma interfaz, así que en las pruebas se usa
   uno en memoria y en la entrega final se puede quitar sin
   cambiar las páginas.
   ========================================================== */

/** Almacén en memoria (pruebas o navegadores sin localStorage). */
export function almacenMemoria() {
  const datos = new Map();
  return {
    leer: (clave) => (datos.has(clave) ? JSON.parse(datos.get(clave)) : null),
    escribir: (clave, valor) => { datos.set(clave, JSON.stringify(valor)); return true; },
    borrar: (clave) => { datos.delete(clave); }
  };
}

/** Almacén sobre un Storage del navegador (localStorage o sessionStorage). */
export function almacenNavegador(storage) {
  return {
    leer(clave) {
      try { return JSON.parse(storage.getItem(clave)); } catch (e) { return null; }
    },
    escribir(clave, valor) {
      try { storage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; }
    },
    borrar(clave) {
      try { storage.removeItem(clave); } catch (e) { /* sin acceso al almacenamiento */ }
    }
  };
}

/** Elige localStorage si está disponible; si no, memoria. */
export function almacenPorDefecto() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('__rc_prueba', '1');
      localStorage.removeItem('__rc_prueba');
      return almacenNavegador(localStorage);
    }
  } catch (e) { /* bloqueado por el navegador */ }
  return almacenMemoria();
}

/** Convierte de nuevo a Date los campos de fecha de un reporte guardado como JSON. */
export function revivirFechas(r) {
  const f = (v) => (v ? new Date(v) : null);
  r.creado = f(r.creado);
  r.resuelto = f(r.resuelto);
  (r.historial || []).forEach((h) => { h.fecha = f(h.fecha); });
  return r;
}
