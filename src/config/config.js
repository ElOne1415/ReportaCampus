/* ==========================================================
   ReportaCampus · Configuración
   ----------------------------------------------------------
   Valores que pueden cambiar sin tocar la lógica de la
   aplicación. Cuando exista el backend (entrega final) basta
   con cambiar FUENTE_DATOS a 'api' y ajustar API_URL.
   ========================================================== */

export const CONFIG = Object.freeze({
  VERSION: '0.3.0',

  // Origen de los datos: 'local' guarda todo en el navegador.
  // 'api' queda reservado para el backend en Flask (entrega final).
  FUENTE_DATOS: 'local',
  API_URL: 'http://localhost:5000/api',

  // Claves de almacenamiento en el navegador
  CLAVES: Object.freeze({
    reportesPropios: 'reportacampus.reportes'
  }),

  // Semilla de los datos simulados (mismos datos en cada carga)
  SEMILLA: 20262,
  DIAS_SIMULADOS: 370,

  // Metas de atención
  META_HORAS: 48,
  META_CUMPLIMIENTO: 85,

  // Interfaz
  TAMANO_PAGINA: 10,
  FOTO_MAX_PX: 640,
  LOCALE: 'es-CO'
});
