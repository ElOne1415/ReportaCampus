/* ==========================================================
   ReportaCampus · Rutas
   ----------------------------------------------------------
   Cada ruta indica su título, el permiso necesario para
   entrar y si aparece en el menú lateral. El menú y el router
   se construyen a partir de esta tabla.
   ========================================================== */
import { ROLES } from '../models/roles.js';

export const RUTAS = Object.freeze({
  login:           { titulo: 'Iniciar sesión',        publica: true },
  'mis-reportes':  { titulo: 'Mis reportes',          permiso: 'reportes.propios', menu: 'Mis reportes' },
  asignados:       { titulo: 'Mis asignaciones',      permiso: 'reportes.asignados', menu: 'Mis asignaciones' },
  panel:           { titulo: 'Panel de incidencias',  permiso: 'panel.ver',       menu: 'Panel' },
  reportes:        { titulo: 'Reportes',              permiso: 'reportes.ver',    menu: 'Reportes' },
  zonas:           { titulo: 'Zonas del campus',      permiso: 'reportes.ver',    menu: 'Zonas del campus' },
  nuevo:           { titulo: 'Nuevo reporte',         permiso: 'reportes.crear',  menu: 'Nuevo reporte' },
  usuarios:        { titulo: 'Usuarios',              permiso: 'usuarios.gestionar', menu: 'Usuarios' },
  recomendaciones: { titulo: 'Recomendaciones',       permiso: 'reportes.ver',    menu: 'Recomendaciones' },
  cuenta:          { titulo: 'Mi cuenta',             permiso: 'panel.ver',       menu: 'Mi cuenta' }
});

/** Página a la que llega cada rol al iniciar sesión. */
export const INICIO_POR_ROL = Object.freeze({
  [ROLES.ESTUDIANTE]: 'mis-reportes',
  [ROLES.RESPONSABLE]: 'asignados',
  [ROLES.ADMIN]: 'panel'
});
