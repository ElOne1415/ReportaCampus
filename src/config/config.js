/* ==========================================================
   ReportaCampus · Configuración
   ----------------------------------------------------------
   Valores que pueden cambiar sin tocar la lógica de la
   aplicación. Cuando exista el backend (entrega final) basta
   con cambiar FUENTE_DATOS a 'api' y ajustar API_URL.
   ========================================================== */

export const CONFIG = Object.freeze({
  VERSION: '1.0.0',

  // Origen de los datos:
  //   'auto'  usa la API si la página la entrega el backend (python run.py),
  //           que agrega <meta name="reportacampus-api">; si no (GitHub Pages),
  //           los datos de demostración guardados en el navegador.
  //   'api'   siempre la API en API_URL (frontend y backend en dominios distintos).
  //   'local' siempre los datos del navegador.
  FUENTE_DATOS: 'auto',
  // Dirección de la API. null = el mismo servidor que entrega la página (/api).
  API_URL: null,
  API_TIEMPO_MS: 15000,   // tiempo máximo de espera de una petición
  API_CACHE_MS: 20000,    // cuánto se reutiliza la lista de reportes antes de pedirla de nuevo

  // Claves de almacenamiento en el navegador
  CLAVES: Object.freeze({
    reportes: 'reportacampus.v3.reportes',
    usuarios: 'reportacampus.v3.usuarios',
    auditoria: 'reportacampus.v3.auditoria',
    sesion: 'reportacampus.sesion',
    // Clave de la versión 0.2 (solo reportes propios); se migra al iniciar
    reportesV2: 'reportacampus.reportes'
  }),

  // Contraseña de las cuentas de demostración. En modo local la usa el
  // inicio de sesión simulado; con el servidor, la valida el backend.
  CONTRASENA_DEMO: 'campus2026',

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
