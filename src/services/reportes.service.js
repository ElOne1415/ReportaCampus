/* ==========================================================
   ReportaCampus · Servicio de reportes
   ----------------------------------------------------------
   Única puerta de entrada a los datos de reportes. Sus métodos
   devuelven promesas para que, en la entrega final, se puedan
   reemplazar por llamadas a la API (fetch) sin cambiar las
   páginas que los usan.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { generarReportes } from '../data/semilla.js';
import { crearReporte, validarReporte, siguienteCodigo, filtrarReportes } from '../models/reporte.js';
import { revivirFechas } from './almacenamiento.js';

export function crearServicioReportes({ almacen, ahora = new Date() }) {
  let reportes = generarReportes(ahora, CONFIG.SEMILLA, CONFIG.DIAS_SIMULADOS);

  // Reportes creados desde el formulario y guardados en el navegador
  const guardados = almacen.leer(CONFIG.CLAVES.reportesPropios) || [];
  guardados.forEach((r) => {
    revivirFechas(r);
    r.propio = true;
    if (reportes.some((x) => x.id === r.id)) r.id = siguienteCodigo(reportes);
    reportes.unshift(r);
  });
  reportes.sort((a, b) => b.creado - a.creado);

  const guardarPropios = () => almacen.escribir(CONFIG.CLAVES.reportesPropios, reportes.filter((x) => x.propio));

  return {
    ahora,
    async listar(filtros) { return filtros ? filtrarReportes(reportes, filtros) : reportes.slice(); },
    async obtener(id) { return reportes.find((x) => x.id === id) || null; },
    async contarPropios() { return reportes.filter((x) => x.propio).length; },

    /** Valida y crea un reporte. Devuelve { ok, errores } o { ok, reporte, guardado }. */
    async crear(datos, autor) {
      const v = validarReporte(datos);
      if (!v.ok) return v;
      const r = crearReporte(datos, autor, siguienteCodigo(reportes));
      reportes.unshift(r);
      return { ok: true, reporte: r, guardado: guardarPropios() };
    },

    async borrarPropios() {
      reportes = reportes.filter((x) => !x.propio);
      almacen.borrar(CONFIG.CLAVES.reportesPropios);
    }
  };
}
