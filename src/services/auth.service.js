/* ==========================================================
   ReportaCampus · Autenticación (simulada)
   ----------------------------------------------------------
   Inicio de sesión de demostración: comprueba que la cuenta
   exista y esté activa, y que la contraseña sea la de
   demostración. La sesión se guarda en sessionStorage, así que
   termina al cerrar la pestaña.

   En la entrega final este servicio enviará las credenciales a
   la API (POST /api/auth/login) y guardará el token que esta
   devuelva; las páginas no cambian.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { CORREO_VALIDO } from '../models/usuario.js';

export function crearServicioAuth({ almacenSesion, usuarios }) {
  return {
    /** @returns {{ ok: true, usuario } | { ok: false, errores } | { ok: false, error }} */
    async iniciarSesion(correo, contrasena) {
      const errores = {};
      if (!CORREO_VALIDO.test((correo || '').trim())) errores.correo = 'Escribe un correo válido.';
      if (!contrasena) errores.contrasena = 'Escribe la contraseña.';
      if (Object.keys(errores).length) return { ok: false, errores };

      const u = await usuarios.porCorreo(correo);
      if (!u || contrasena !== CONFIG.CONTRASENA_DEMO) return { ok: false, error: 'El correo o la contraseña no son correctos.' };
      if (!u.activo) return { ok: false, error: 'Esta cuenta está desactivada. Habla con el administrador.' };
      almacenSesion.escribir(CONFIG.CLAVES.sesion, { usuarioId: u.id, inicio: new Date() });
      return { ok: true, usuario: u };
    },

    /** Usuario con sesión abierta, o null. Si la cuenta se desactivó, cierra la sesión. */
    usuarioActual() {
      const s = almacenSesion.leer(CONFIG.CLAVES.sesion);
      const u = s && usuarios.obtenerSync(s.usuarioId);
      if (!u || !u.activo) { if (s) almacenSesion.borrar(CONFIG.CLAVES.sesion); return null; }
      return u;
    },

    /** Igual que usuarioActual(); existe para tener la misma interfaz que la API. */
    async refrescar() { return this.usuarioActual(); },

    cerrarSesion() { almacenSesion.borrar(CONFIG.CLAVES.sesion); }
  };
}
