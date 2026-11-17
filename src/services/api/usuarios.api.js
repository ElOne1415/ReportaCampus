/* ==========================================================
   ReportaCampus · Servicio de usuarios sobre la API
   Misma interfaz que src/services/usuarios.service.js.
   ========================================================== */
import { consulta } from './cliente.js';

const conFecha = (u) => (u ? { ...u, creado: u.creado ? new Date(u.creado) : null } : u);

export function crearUsuariosApi({ cliente }) {
  const ruta = (id, accion = '') => '/usuarios/' + encodeURIComponent(id) + accion;
  const uno = (res) => (res.ok ? { ...res, usuario: conFecha(res.usuario), guardado: true } : res);

  return {
    async listar(f = {}) {
      const res = await cliente.get('/usuarios' + consulta({ texto: f.texto, rol: f.rol, activo: f.activo === undefined ? '' : (f.activo ? 'si' : 'no') }));
      if (!res.ok) throw new Error(res.error);
      return res.usuarios.map(conFecha);
    },
    async obtener(id) {
      const res = await cliente.get(ruta(id));
      return res.ok ? conFecha(res.usuario) : null;
    },
    async responsables(categoria) {
      const res = await cliente.get('/usuarios/responsables' + consulta({ categoria }));
      if (!res.ok) throw new Error(res.error);
      return res.usuarios;
    },
    async cuentasDemo() {
      const res = await cliente.get('/auth/cuentas-demo');
      return res.ok ? res.cuentas : [];
    },
    crear: async (datos) => uno(await cliente.post('/usuarios', datos)),
    editar: async (id, datos) => uno(await cliente.put(ruta(id), datos)),
    cambiarActivo: async (id, activo) => uno(await cliente.patch(ruta(id, '/activo'), { activo })),
    eliminar: async (id) => { const res = await cliente.del(ruta(id)); return { ...res, guardado: res.ok }; },
    // El servidor restablece reportes y usuarios en una sola operación (reportes.restablecer)
    async restablecer() { return { ok: true }; }
  };
}
