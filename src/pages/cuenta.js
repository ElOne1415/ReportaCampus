/* ==========================================================
   Página: Mi cuenta (todos los roles)
   Datos del usuario y cambio de contraseña.
   ========================================================== */
import { categoriaPorId } from '../models/catalogos.js';
import { INFO_ROLES } from '../models/roles.js';
import { validarContrasenaNueva } from '../models/usuario.js';
import { $, conBoton } from '../utils/dom.js';
import { esc, fFecha } from '../utils/formato.js';

// Campo del servicio → id del control
const CONTROLES = { actual: 'cActual', nueva: 'cNueva', confirmacion: 'cConfirmar' };

export function crearPaginaCuenta(app) {
  function marcar(campo, mensaje) {
    const id = CONTROLES[campo];
    $('#' + id).classList.toggle('invalid', !!mensaje);
    $('#' + id).setAttribute('aria-invalid', String(!!mensaje));
    const err = $('.error[data-for="' + id + '"]');
    err.textContent = mensaje || '';
    err.classList.toggle('show', !!mensaje);
  }

  async function guardar(e) {
    e.preventDefault();
    Object.keys(CONTROLES).forEach((c) => marcar(c, null));
    const actual = $('#cActual').value, nueva = $('#cNueva').value;
    const errores = {};
    if (!actual) errores.actual = 'Escribe tu contraseña actual.';
    Object.assign(errores, validarContrasenaNueva(nueva, $('#cConfirmar').value, actual).errores);
    if (!Object.keys(errores).length) {
      const res = await conBoton($('#cGuardar'), 'Guardando…', () => app.auth.cambiarContrasena(actual, nueva));
      if (res.ok) {
        e.target.reset();
        app.aviso('Tu contraseña se cambió. Úsala la próxima vez que inicies sesión.');
        return;
      }
      if (res.error) { app.avisoError(res.error); return; }
      Object.assign(errores, res.errores);
    }
    Object.entries(errores).forEach(([c, m]) => marcar(c, m));
    const primero = $('#claveForm .invalid');
    if (primero) primero.focus();
  }

  return {
    id: 'cuenta',
    montar() {
      $('#claveForm').addEventListener('submit', guardar);
      Object.entries(CONTROLES).forEach(([c, id]) => $('#' + id).addEventListener('input', () => marcar(c, null)));
    },
    async mostrar() {
      const u = app.usuario;
      const filas = [
        ['Nombre', esc(u.nombre)],
        ['Correo', esc(u.correo)],
        ['Rol', '<span class="role-badge role-badge--' + u.rol + '">' + INFO_ROLES[u.rol].nombre + '</span>'],
        ['Cuenta creada', u.creado ? fFecha.format(new Date(u.creado)) : '—']
      ];
      if (u.area) filas.push(['Área', esc(u.area)], ['Atiende', u.categorias.map((c) => categoriaPorId[c].nombre).join(', ')]);
      $('#cuentaDatos').innerHTML = filas.map((f) => '<div><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>').join('') +
        '<div class="facts__wide"><dt>Qué puedes hacer</dt><dd>' + INFO_ROLES[u.rol].descripcion + '</dd></div>';
    }
  };
}
