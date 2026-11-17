/* ==========================================================
   ReportaCampus · Punto de entrada
   Crea los servicios, monta las páginas y conecta el router
   con la sesión y los permisos del usuario.
   ========================================================== */
import { crearServicios } from './services/index.js';
import { RUTAS, INICIO_POR_ROL } from './config/rutas.js';
import { puede } from './models/roles.js';
import { crearRouter } from './router.js';
import { iniciarMenu, marcarActivo, pintarMenu, pintarUsuario } from './components/navegacion.js';
import { iniciarDetalle, abrirDetalle, cerrarDetalle } from './components/detalle.js';
import { aviso } from './components/toast.js';
import { crearPaginaLogin } from './pages/login.js';
import { crearPaginaMisReportes } from './pages/mis-reportes.js';
import { crearPaginaAsignados } from './pages/asignados.js';
import { crearPaginaPanel } from './pages/panel.js';
import { crearPaginaReportes, FILTROS_VACIOS } from './pages/reportes.js';
import { crearPaginaZonas } from './pages/zonas.js';
import { crearPaginaNuevo } from './pages/nuevo.js';
import { crearPaginaUsuarios } from './pages/usuarios.js';
import { crearPaginaRecomendaciones } from './pages/recomendaciones.js';

const servicios = crearServicios();
let destino = null; // ruta pedida antes de iniciar sesión

const app = {
  ...servicios,
  usuario: servicios.auth.usuarioActual(),
  estado: { filtros: { ...FILTROS_VACIOS } },
  aviso,
  puede: (permiso) => puede(app.usuario, permiso),
  async abrirReporte(id) {
    const r = await app.reportes.obtener(id);
    if (r) abrirDetalle(r, app);
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
  alCambiarSesion() {
    app.usuario = app.auth.usuarioActual();
    if (!app.usuario) { app.cerrarSesion(); return; }
    aplicarSesion();
    marcarActivo(actual);
  },
  cerrarSesion() {
    app.auth.cerrarSesion();
    app.usuario = null;
    cerrarDetalle();
    aplicarSesion();
    router.navegar('login');
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
  await paginas[nombre].mostrar(params);
  // Lleva el foco al título para lectores de pantalla y teclado
  if (cambio) {
    const titulo = document.querySelector('[data-pagina="' + nombre + '"] h1');
    if (titulo) titulo.focus({ preventScroll: true });
  }
}

const router = crearRouter({
  rutas: RUTAS,
  inicio: () => (app.usuario ? INICIO_POR_ROL[app.usuario.rol] : 'login'),
  puedeEntrar,
  alEntrar: entrar
});

iniciarMenu();
iniciarDetalle();
document.getElementById('cerrarSesion').addEventListener('click', app.cerrarSesion);
Object.values(paginas).forEach((p) => p.montar());
aplicarSesion();
router.iniciar();
