/* ==========================================================
   ReportaCampus · Punto de entrada
   Crea los servicios, monta las páginas y conecta el router.
   ========================================================== */
import { crearServicios } from './services/index.js';
import { crearRouter } from './router.js';
import { iniciarMenu, marcarActivo } from './components/navegacion.js';
import { iniciarDetalle, abrirDetalle } from './components/detalle.js';
import { aviso } from './components/toast.js';
import { crearPaginaPanel } from './pages/panel.js';
import { crearPaginaReportes, FILTROS_VACIOS } from './pages/reportes.js';
import { crearPaginaZonas } from './pages/zonas.js';
import { crearPaginaNuevo } from './pages/nuevo.js';
import { crearPaginaRecomendaciones } from './pages/recomendaciones.js';

// Rutas de la aplicación y título de cada una
const RUTAS = {
  panel: { titulo: 'Panel de incidencias' },
  reportes: { titulo: 'Reportes' },
  zonas: { titulo: 'Zonas del campus' },
  nuevo: { titulo: 'Nuevo reporte' },
  recomendaciones: { titulo: 'Recomendaciones' }
};

const servicios = crearServicios();

const app = {
  ...servicios,
  // Mientras no hay inicio de sesión se trabaja como la estudiante de demostración
  usuario: servicios.usuarios.obtenerSync('u-007'),
  estado: { filtros: { ...FILTROS_VACIOS } },
  aviso,
  async abrirReporte(id) {
    const r = await app.reportes.obtener(id);
    if (r) abrirDetalle(r, app);
  },
  irA(ruta, params) { router.navegar(ruta, params); }
};

const paginas = Object.fromEntries([
  crearPaginaPanel(app),
  crearPaginaReportes(app),
  crearPaginaZonas(app),
  crearPaginaNuevo(app),
  crearPaginaRecomendaciones(app)
].map((p) => [p.id, p]));

let actual = null;

async function entrar(nombre, params) {
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
  inicio: () => 'panel',
  alEntrar: entrar
});

iniciarMenu();
iniciarDetalle();
Object.values(paginas).forEach((p) => p.montar());
router.iniciar();
