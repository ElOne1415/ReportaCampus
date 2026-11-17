/* ==========================================================
   ReportaCampus · Autenticación sobre la API
   ----------------------------------------------------------
   El servidor valida la contraseña y entrega un token (JWT)
   que se guarda en sessionStorage junto con el usuario. Al
   cargar la página se confirma con GET /auth/yo que la sesión
   siga vigente.
   ========================================================== */
import { CONFIG } from '../../config/config.js';

export function crearAuthApi({ cliente, almacenSesion }) {
  const sesion = () => almacenSesion.leer(CONFIG.CLAVES.sesion);

  return {
    async iniciarSesion(correo, contrasena) {
      const res = await cliente.post('/auth/login', { correo: (correo || '').trim(), contrasena });
      if (!res.ok) return res;
      almacenSesion.escribir(CONFIG.CLAVES.sesion, { token: res.token, usuario: res.usuario, inicio: new Date() });
      return { ok: true, usuario: res.usuario };
    },

    /** Usuario guardado de la sesión, o null. */
    usuarioActual() {
      const s = sesion();
      return s && s.token && s.usuario ? s.usuario : null;
    },

    /** Confirma la sesión con el servidor y actualiza los datos del usuario. */
    async refrescar() {
      const s = sesion();
      if (!s || !s.token) return null;
      const res = await cliente.get('/auth/yo');
      if (!res.ok) {
        if (res.estado === 401) almacenSesion.borrar(CONFIG.CLAVES.sesion);
        return res.red ? s.usuario : null;
      }
      almacenSesion.escribir(CONFIG.CLAVES.sesion, { ...s, usuario: res.usuario });
      return res.usuario;
    },

    async cambiarContrasena(actual, nueva) {
      return cliente.post('/auth/contrasena', { actual, nueva });
    },

    cerrarSesion() { almacenSesion.borrar(CONFIG.CLAVES.sesion); }
  };
}
