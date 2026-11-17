/* ==========================================================
   ReportaCampus · Servicio de usuarios
   ----------------------------------------------------------
   Registro y gestión de usuarios (solo administrador).
   Misma forma de respuesta que el servicio de reportes.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { generarUsuarios } from '../data/usuarios.js';
import { validarUsuario, construirUsuario, siguienteIdUsuario } from '../models/usuario.js';
import { puede, ROLES } from '../models/roles.js';

const SIN_PERMISO = { ok: false, error: 'No tienes permiso para gestionar usuarios.' };
const CUENTAS_DEMO = ['valentina.martinez@campus.edu.co', 'diana.rojas@campus.edu.co', 'admin@campus.edu.co'];
const NO_EXISTE = { ok: false, error: 'El usuario no existe.' };

export function crearServicioUsuarios({ almacen, ahora = new Date() }) {
  let usuarios = cargar();
  // Se conecta después de crear el servicio de reportes (dependencia circular)
  let tieneAbiertos = () => false;

  function cargar() {
    const guardados = almacen.leer(CONFIG.CLAVES.usuarios);
    if (Array.isArray(guardados)) return guardados.map((u) => ({ ...u, creado: new Date(u.creado) }));
    const lista = generarUsuarios(ahora);
    almacen.escribir(CONFIG.CLAVES.usuarios, lista);
    return lista;
  }

  const guardar = () => almacen.escribir(CONFIG.CLAVES.usuarios, usuarios);
  const buscar = (id) => usuarios.find((u) => u.id === id);
  const adminsActivos = () => usuarios.filter((u) => u.rol === ROLES.ADMIN && u.activo);

  return {
    conectarReportes(fn) { tieneAbiertos = fn; },

    obtenerSync(id) { return buscar(id) || null; },
    async obtener(id) { return buscar(id) || null; },
    /** Una cuenta activa de cada rol para entrar con un clic. */
    async cuentasDemo() {
      return CUENTAS_DEMO.map((c) => usuarios.find((u) => u.correo === c)).filter((u) => u && u.activo);
    },

    async porCorreo(correo) { return usuarios.find((u) => u.correo === (correo || '').trim().toLowerCase()) || null; },

    async listar(f = {}) {
      const t = (f.texto || '').trim().toLowerCase();
      return usuarios.filter((u) =>
        (!f.rol || u.rol === f.rol) &&
        (f.activo === undefined || u.activo === f.activo) &&
        (!t || (u.nombre + ' ' + u.correo + ' ' + u.area).toLowerCase().includes(t))
      );
    },

    /** Responsables activos; primero los que atienden la categoría indicada. */
    async responsables(categoria) {
      return usuarios.filter((u) => u.rol === ROLES.RESPONSABLE && u.activo)
        .sort((a, b) => (b.categorias.includes(categoria) - a.categorias.includes(categoria)) || a.nombre.localeCompare(b.nombre));
    },

    async crear(datos, actor) {
      if (!puede(actor, 'usuarios.gestionar')) return SIN_PERMISO;
      const v = validarUsuario(datos, usuarios);
      if (!v.ok) return v;
      const u = construirUsuario(datos, siguienteIdUsuario(usuarios));
      usuarios.push(u);
      return { ok: true, usuario: u, guardado: guardar() };
    },

    async editar(id, datos, actor) {
      if (!puede(actor, 'usuarios.gestionar')) return SIN_PERMISO;
      const u = buscar(id);
      if (!u) return NO_EXISTE;
      const v = validarUsuario(datos, usuarios, id);
      if (!v.ok) return v;
      if (u.rol === ROLES.RESPONSABLE && datos.rol !== ROLES.RESPONSABLE && tieneAbiertos(id)) {
        return { ok: false, error: 'Este responsable tiene reportes sin resolver. Reasígnalos antes de cambiar su rol.' };
      }
      if (u.rol === ROLES.ADMIN && datos.rol !== ROLES.ADMIN && adminsActivos().length === 1 && u.activo) {
        return { ok: false, error: 'Debe quedar al menos un administrador activo.' };
      }
      const nuevo = construirUsuario({ ...datos, activo: u.activo }, id, u.creado);
      // La huella de la contraseña depende del correo: si cambia, vuelve la contraseña inicial
      if (nuevo.correo !== u.correo) delete u.claveHash;
      Object.assign(u, nuevo);
      return { ok: true, usuario: u, guardado: guardar() };
    },

    /** Guarda la huella de la nueva contraseña (la llama el servicio de autenticación). */
    async establecerClave(id, claveHash) {
      const u = buscar(id);
      if (!u) return NO_EXISTE;
      u.claveHash = claveHash;
      return { ok: true, guardado: guardar() };
    },

    async cambiarActivo(id, activo, actor) {
      if (!puede(actor, 'usuarios.gestionar')) return SIN_PERMISO;
      const u = buscar(id);
      if (!u) return NO_EXISTE;
      if (u.id === actor.id && !activo) return { ok: false, error: 'No puedes desactivar tu propia cuenta.' };
      if (!activo && u.rol === ROLES.RESPONSABLE && tieneAbiertos(id)) {
        return { ok: false, error: 'Este responsable tiene reportes sin resolver. Reasígnalos antes de desactivarlo.' };
      }
      u.activo = !!activo;
      return { ok: true, usuario: u, guardado: guardar() };
    },

    async eliminar(id, actor) {
      if (!puede(actor, 'usuarios.gestionar')) return SIN_PERMISO;
      const u = buscar(id);
      if (!u) return NO_EXISTE;
      if (u.id === actor.id) return { ok: false, error: 'No puedes eliminar tu propia cuenta.' };
      if (u.rol === ROLES.RESPONSABLE && tieneAbiertos(id)) {
        return { ok: false, error: 'Este responsable tiene reportes sin resolver. Reasígnalos antes de eliminarlo.' };
      }
      if (u.rol === ROLES.ADMIN && adminsActivos().length === 1 && u.activo) return { ok: false, error: 'Debe quedar al menos un administrador activo.' };
      usuarios = usuarios.filter((x) => x !== u);
      return { ok: true, guardado: guardar() };
    },

    async restablecer(actor) {
      if (!puede(actor, 'datos.restablecer')) return SIN_PERMISO;
      usuarios = generarUsuarios(new Date());
      return { ok: true, guardado: guardar() };
    }
  };
}
