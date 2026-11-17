/* ==========================================================
   ReportaCampus · Modelo de usuario
   ========================================================== */
import { categoriaPorId } from './catalogos.js';
import { LISTA_ROLES, ROLES } from './roles.js';

export const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizarCorreo = (c) => (c || '').trim().toLowerCase();

/**
 * Valida los datos de un usuario.
 * @param {object} d datos del formulario
 * @param {object[]} existentes usuarios ya registrados
 * @param {string|null} idActual id del usuario que se edita (para no chocar consigo mismo)
 */
export function validarUsuario(d, existentes = [], idActual = null) {
  const errores = {};
  const nombre = (d.nombre || '').trim();
  const correo = normalizarCorreo(d.correo);
  if (nombre.length < 3) errores.nombre = 'Escribe el nombre completo (mínimo 3 caracteres).';
  else if (nombre.length > 60) errores.nombre = 'Máximo 60 caracteres.';
  if (!CORREO_VALIDO.test(correo)) errores.correo = 'Escribe un correo válido.';
  else if (existentes.some((u) => u.correo === correo && u.id !== idActual)) errores.correo = 'Ya existe un usuario con ese correo.';
  if (!LISTA_ROLES.includes(d.rol)) errores.rol = 'Elige un rol.';
  if (d.rol === ROLES.RESPONSABLE) {
    if ((d.area || '').trim().length < 3) errores.area = 'Escribe el área o dependencia.';
    const cats = (d.categorias || []).filter((c) => categoriaPorId[c]);
    if (!cats.length) errores.categorias = 'Elige al menos una categoría que atiende.';
  }
  return { ok: Object.keys(errores).length === 0, errores };
}

/** Construye un usuario con los datos ya validados. */
export function construirUsuario(d, id, ahora = new Date()) {
  const esResponsable = d.rol === ROLES.RESPONSABLE;
  return {
    id,
    nombre: d.nombre.trim(),
    correo: normalizarCorreo(d.correo),
    rol: d.rol,
    area: esResponsable ? d.area.trim() : '',
    categorias: esResponsable ? d.categorias.filter((c) => categoriaPorId[c]) : [],
    activo: d.activo !== false,
    creado: ahora
  };
}

/** "Planta física – Diana Rojas" para responsables; el nombre para los demás. */
export const nombreConArea = (u) => (u ? (u.area ? u.area + ' – ' + u.nombre : u.nombre) : 'Sin asignar');

export function siguienteIdUsuario(usuarios) {
  const max = usuarios.reduce((m, u) => Math.max(m, parseInt(u.id.slice(2), 10) || 0), 0);
  return 'u-' + String(max + 1).padStart(3, '0');
}

/** Contraseña nueva: mínimo 8 caracteres con letras y números (igual que el backend). */
export function validarContrasenaNueva(nueva, confirmacion, actual) {
  const errores = {};
  if (typeof nueva !== 'string' || nueva.length < 8) errores.nueva = 'Usa al menos 8 caracteres.';
  else if (nueva.length > 72) errores.nueva = 'Máximo 72 caracteres.';
  else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(nueva) || !/\d/.test(nueva)) errores.nueva = 'Combina letras y números.';
  else if (actual !== undefined && nueva === actual) errores.nueva = 'La nueva contraseña debe ser distinta de la actual.';
  if (confirmacion !== undefined && !errores.nueva && confirmacion !== nueva) errores.confirmacion = 'Las contraseñas no coinciden.';
  return { ok: Object.keys(errores).length === 0, errores };
}

/**
 * Huella SHA-256 de la contraseña (modo local). En el navegador no hay
 * forma de guardar una contraseña de verdad segura; con el servidor se
 * usa PBKDF2 con sal en el backend.
 */
export async function huellaContrasena(correo, contrasena) {
  const datos = new TextEncoder().encode('reportacampus:' + correo + ':' + contrasena);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
