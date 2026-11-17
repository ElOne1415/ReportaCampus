/* ==========================================================
   Página: Inicio de sesión (simulado)
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { INFO_ROLES } from '../models/roles.js';
import { $ } from '../utils/dom.js';
import { esc } from '../utils/formato.js';

// Una cuenta de cada rol para entrar con un clic
const CUENTAS_RAPIDAS = ['valentina.martinez@campus.edu.co', 'diana.rojas@campus.edu.co', 'admin@campus.edu.co'];

export function crearPaginaLogin(app) {
  function marcar(id, mensaje) {
    $('#' + id).classList.toggle('invalid', !!mensaje);
    $('#' + id).setAttribute('aria-invalid', String(!!mensaje));
    const err = $('.error[data-for="' + id + '"]');
    err.textContent = mensaje || '';
    err.classList.toggle('show', !!mensaje);
  }

  function mostrarError(mensaje) {
    $('#loginError').hidden = !mensaje;
    $('#loginError').textContent = mensaje || '';
  }

  async function entrar(correo, contrasena) {
    marcar('lCorreo', null);
    marcar('lContrasena', null);
    mostrarError(null);
    const res = await app.auth.iniciarSesion(correo, contrasena);
    if (!res.ok) {
      if (res.errores) {
        if (res.errores.correo) marcar('lCorreo', res.errores.correo);
        if (res.errores.contrasena) marcar('lContrasena', res.errores.contrasena);
        const primero = $('#login .invalid');
        if (primero) primero.focus();
      } else {
        mostrarError(res.error);
      }
      return;
    }
    $('#loginForm').reset();
    app.alIniciarSesion(res.usuario);
  }

  return {
    id: 'login',
    montar() {
      $('#contrasenaDemo').textContent = CONFIG.CONTRASENA_DEMO;
      $('#loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        entrar($('#lCorreo').value, $('#lContrasena').value);
      });
      ['lCorreo', 'lContrasena'].forEach((id) => $('#' + id).addEventListener('input', () => marcar(id, null)));
      $('#cuentasDemo').addEventListener('click', (e) => {
        const b = e.target.closest('[data-correo]');
        if (b) entrar(b.dataset.correo, CONFIG.CONTRASENA_DEMO);
      });
    },
    async mostrar() {
      const cuentas = (await Promise.all(CUENTAS_RAPIDAS.map((c) => app.usuarios.porCorreo(c)))).filter((u) => u && u.activo);
      $('#cuentasDemo').innerHTML = cuentas.map((u) =>
        '<button type="button" class="account" data-correo="' + esc(u.correo) + '">' +
        '<span class="account__name">' + esc(u.nombre) + (u.area ? ' · ' + esc(u.area) : '') + '</span>' +
        '<span class="account__mail">' + esc(u.correo) + '</span>' +
        '<span class="role-badge role-badge--' + u.rol + '">' + INFO_ROLES[u.rol].nombre + '</span></button>'
      ).join('');
    }
  };
}
