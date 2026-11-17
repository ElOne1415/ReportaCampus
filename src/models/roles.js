/* ==========================================================
   ReportaCampus · Roles y permisos
   ----------------------------------------------------------
   Matriz de permisos por rol y reglas que dependen de un
   reporte concreto (por ejemplo, solo el autor puede editar su
   reporte mientras está en estado Nuevo). Las mismas reglas se
   aplicarán en el backend de la entrega final.
   ========================================================== */
import { ESTADOS } from './catalogos.js';

export const ROLES = Object.freeze({
  ESTUDIANTE: 'estudiante',
  RESPONSABLE: 'responsable',
  ADMIN: 'administrador'
});

export const INFO_ROLES = Object.freeze({
  estudiante: { nombre: 'Estudiante', descripcion: 'Crea reportes y sigue el estado de los suyos.' },
  responsable: { nombre: 'Responsable', descripcion: 'Atiende los reportes que tiene asignados y actualiza su estado.' },
  administrador: { nombre: 'Administrador', descripcion: 'Asigna responsables, gestiona todos los reportes y los usuarios.' }
});

export const LISTA_ROLES = Object.freeze(Object.values(ROLES));

const { ESTUDIANTE: E, RESPONSABLE: R, ADMIN: A } = ROLES;

/** Permisos generales: qué roles pueden hacer cada acción. */
export const PERMISOS = Object.freeze({
  'panel.ver':                 [E, R, A],
  'reportes.ver':              [E, R, A],
  'reportes.crear':            [E, R, A],
  'reportes.propios':          [E],
  'reportes.asignados':        [R],
  'reportes.exportar':         [R, A],
  'reportes.cambiarEstado':    [R, A],
  'reportes.comentar':         [R, A],
  'reportes.asignar':          [A],
  'reportes.cambiarPrioridad': [A],
  'reportes.eliminar':         [A],
  'usuarios.gestionar':        [A],
  'datos.restablecer':         [A]
});

/** ¿El usuario tiene el permiso general? */
export function puede(usuario, permiso) {
  return !!usuario && usuario.activo !== false && (PERMISOS[permiso] || []).includes(usuario.rol);
}

const esAutor = (u, r) => !!u && r.autorId === u.id;
const esResponsableDe = (u, r) => !!u && u.rol === R && r.responsableId === u.id;

/** El autor puede editar su reporte mientras nadie lo ha tomado. */
export function puedeEditarReporte(u, r) {
  return puede(u, 'reportes.crear') && esAutor(u, r) && r.estado === ESTADOS.NUEVO;
}

/** El autor puede eliminar su reporte en estado Nuevo; el administrador, cualquiera. */
export function puedeEliminarReporte(u, r) {
  return puede(u, 'reportes.eliminar') || (esAutor(u, r) && r.estado === ESTADOS.NUEVO && u.activo !== false);
}

/** El administrador cambia cualquier estado; el responsable, solo el de sus reportes. */
export function puedeCambiarEstado(u, r) {
  if (!puede(u, 'reportes.cambiarEstado')) return false;
  return u.rol === A || esResponsableDe(u, r);
}

export function puedeComentar(u, r) {
  if (!puede(u, 'reportes.comentar')) return false;
  return u.rol === A || esResponsableDe(u, r);
}
