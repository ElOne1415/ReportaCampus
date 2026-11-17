/* ==========================================================
   ReportaCampus · Punto de entrada
   Elige la fuente de datos (servidor o navegador), monta las
   páginas y conecta el router con la sesión y los permisos.
   ========================================================== */
import { iniciarServicios } from './services/index.js';
import { RUTAS, INICIO_POR_ROL } from './config/rutas.js';
import { puede } from './models/roles.js';
import { crearRouter } from './router.js';
import { iniciarMenu, marcarActivo, pintarMenu, pintarUsuario } from './components/navegacion.js';
import { iniciarDetalle, abrirDetalle, cerrarDetalle } from './components/detalle.js';
import { aviso, avisoError } from './components/toast.js';
import { conCarga, mostrarErrorPagina, quitarErrorPagina } from './components/estado-carga.js';
import { crearPaginaLogin } from './pages/login.js';
import { crearPaginaMisReportes } from './pages/mis-reportes.js';
import { crearPaginaAsignados } from './pages/asignados.js';
import { crearPaginaPanel } from './pages/panel.js';
import { crearPaginaReportes, FILTROS_VACIOS } from './pages/reportes.js';
import { crearPaginaZonas } from './pages/zonas.js';
import { crearPaginaNuevo } from './pages/nuevo.js';
import { crearPaginaUsuarios } from './pages/usuarios.js';
import { crearPaginaCuenta } from './pages/cuenta.js';
import { crearPaginaActividad } from './pages/actividad.js';
import { crearPaginaRecomendaciones } from './pages/recomendaciones.js';

// Si el servidor responde 401 (token vencido o cuenta desactivada) se vuelve al inicio de sesión
const servicios = await iniciarServicios({ alVencerSesion: (mensaje) => { if (app.usuario) app.cerrarSesion(mensaje); } });
let destino = null; // ruta pedida antes de iniciar sesión

const app = {
  ...servicios,
  usuario: await servicios.auth.refrescar(),
  estado: { filtros: { ...FILTROS_VACIOS } },
  aviso,
  avisoError,
  puede: (permiso) => puede(app.usuario, permiso),
  async abrirReporte(id) {
    const r = await conCarga(app.reportes.obtener(id));
    if (r) abrirDetalle(r, app);
    else avisoError('No se pudo abrir el reporte ' + id + '. Puede que lo hayan eliminado o que no haya conexión.');
  },
  cerrarDetalle,
  irA(ruta, params) { router.navegar(ruta, params); },
  /** Vuelve a dibujar la página actual (después de un cambio en los datos). */
  recargarPagina() { if (actual) paginas[actual].mostrar({ conservar: true }); },
  /** Después de modificar un reporte: actualiza la página y el detalle abierto. */
  async alCambiarReporte(id) {
    app.recargarPagina();
    await app.abrirReporte(id);
  },
  alIniciarSesion(usuario) {
    app.usuario = usuario;
    app.estado.filtros = { ...FILTROS_VACIOS };
    aplicarSesion();
    aviso('Hola, ' + usuario.nombre.split(' ')[0] + '.');
    const ir = destino && puede(usuario, RUTAS[destino.nombre].permiso) ? destino : { nombre: INICIO_POR_ROL[usuario.rol] };
    destino = null;
    router.navegar(ir.nombre, ir.params);
  },
  /** Vuelve a leer el usuario de la sesión (si cambió su nombre o sus datos). */
  async alCambiarSesion() {
    app.usuario = await app.auth.refrescar();
    if (!app.usuario) { app.cerrarSesion(); return; }
    aplicarSesion();
    marcarActivo(actual);
  },
  /** @param {string} [mensaje] motivo para mostrar (por ejemplo, sesión vencida) */
  cerrarSesion(mensaje) {
    app.auth.cerrarSesion();
    if (app.reportes.olvidar) app.reportes.olvidar();
    app.usuario = null;
    cerrarDetalle();
    aplicarSesion();
    router.navegar('login');
    if (typeof mensaje === 'string') aviso(mensaje);
  }
};

const paginas = Object.fromEntries([
  crearPaginaLogin(app),
  crearPaginaMisReportes(app),
  crearPaginaAsignados(app),
  crearPaginaPanel(app),
  crearPaginaReportes(app),
  crearPaginaZonas(app),
  crearPaginaNuevo(app),
  crearPaginaUsuarios(app),
  crearPaginaCuenta(app),
  crearPaginaActividad(app),
  crearPaginaRecomendaciones(app)
].map((p) => [p.id, p]));

/** Muestra la barra de usuario y el menú que corresponde a su rol. */
function aplicarSesion() {
  pintarUsuario(app.usuario);
  pintarMenu(Object.entries(RUTAS)
    .filter(([, r]) => r.menu && app.puede(r.permiso))
    .map(([ruta, r]) => ({ ruta, texto: r.menu })));
}

/** Decide si se puede entrar a una ruta; si no, devuelve a dónde ir. */
function puedeEntrar(nombre, params) {
  const ruta = RUTAS[nombre];
  if (!app.usuario) {
    if (ruta.publica) return true;
    destino = { nombre, params };
    return 'login';
  }
  if (ruta.publica) return INICIO_POR_ROL[app.usuario.rol];
  if (!app.puede(ruta.permiso)) {
    aviso('No tienes acceso a esa sección.');
    return INICIO_POR_ROL[app.usuario.rol];
  }
  return true;
}

let actual = null;

async function entrar(nombre, params) {
  const esLogin = nombre === 'login';
  document.getElementById('shell').hidden = esLogin;
  document.getElementById('login').hidden = !esLogin;
  document.querySelectorAll('.page').forEach((s) => { s.hidden = s.dataset.pagina !== nombre; });
  marcarActivo(nombre);
  document.title = RUTAS[nombre].titulo + ' · ReportaCampus';
  const cambio = actual !== nombre;
  actual = nombre;
  if (cambio) window.scrollTo(0, 0);
  const seccion = document.querySelector('[data-pagina="' + nombre + '"]');
  quitarErrorPagina(seccion);
  try {
    await conCarga(paginas[nombre].mostrar(params));
  } catch (e) {
    // Sin conexión o error del servidor: la página muestra el problema y permite reintentar
    mostrarErrorPagina(seccion, e.message || 'Intenta de nuevo.', () => entrar(nombre, params));
  }
  // Lleva el foco al título para lectores de pantalla y teclado
  if (cambio) {
    const titulo = document.querySelector('[data-pagina="' + nombre + '"] h1');
    if (titulo) titulo.focus({ preventScroll: true });
  }
}

/** Pie de página: de dónde vienen los datos. */
function pintarFuente(f) {
  const nombres = { sqlite: 'SQLite', mssql: 'SQL Server' };
  document.getElementById('fuenteDatos').textContent = f.modo === 'api'
    ? (f.sinConexion ? 'Sin conexión con el servidor' : 'Datos del servidor' + (f.baseDatos ? ' (' + (nombres[f.baseDatos] || f.baseDatos) + ')' : ''))
    : 'Demostración: los datos se guardan en este navegador';
}

const router = crearRouter({
  rutas: RUTAS,
  inicio: () => (app.usuario ? INICIO_POR_ROL[app.usuario.rol] : 'login'),
  puedeEntrar,
  alEntrar: entrar
});

// Errores que no atrapó ninguna página: aviso en lugar de un fallo silencioso
window.addEventListener('unhandledrejection', (e) => {
  console.error(e.reason);
  avisoError('Algo salió mal: ' + ((e.reason && e.reason.message) || 'intenta de nuevo.'));
});
window.addEventListener('offline', () => avisoError('Perdiste la conexión a internet.'));
window.addEventListener('online', () => aviso('Conexión restablecida.'));

iniciarMenu();
iniciarDetalle();
document.getElementById('cerrarSesion').addEventListener('click', () => app.cerrarSesion());
pintarFuente(servicios.fuente);
Object.values(paginas).forEach((p) => p.montar());
aplicarSesion();
router.iniciar();
