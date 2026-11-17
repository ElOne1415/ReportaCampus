/* ==========================================================
   ReportaCampus · Punto de entrada
   Crea los servicios, monta las páginas y las conecta.
   ========================================================== */
import { almacenPorDefecto } from './services/almacenamiento.js';
import { crearServicioReportes } from './services/reportes.service.js';
import { iniciarMenu, seguirSeccionVisible } from './components/navegacion.js';
import { iniciarDetalle, abrirDetalle } from './components/detalle.js';
import { aviso } from './components/toast.js';
import { crearPaginaPanel } from './pages/panel.js';
import { crearPaginaReportes, FILTROS_VACIOS } from './pages/reportes.js';
import { crearPaginaZonas } from './pages/zonas.js';
import { crearPaginaNuevo } from './pages/nuevo.js';
import { crearPaginaRecomendaciones } from './pages/recomendaciones.js';

const app = {
  reportes: crearServicioReportes({ almacen: almacenPorDefecto() }),
  estado: { filtros: { ...FILTROS_VACIOS } },
  FILTROS_VACIOS,
  aviso,
  async abrirReporte(id) {
    const r = await app.reportes.obtener(id);
    if (r) abrirDetalle(r);
  },
  async irA(seccion, params) {
    await paginas[seccion].mostrar(params);
    if (seccion === 'reportes') paginas.panel.mostrar();
    document.getElementById(seccion).scrollIntoView({ behavior: 'smooth' });
  },
  alCambiarFiltros() { paginas.panel.mostrar(); },
  async refrescar() {
    await Promise.all(['panel', 'reportes', 'zonas'].map((p) => paginas[p].mostrar()));
  }
};

const paginas = Object.fromEntries([
  crearPaginaPanel(app),
  crearPaginaReportes(app),
  crearPaginaZonas(app),
  crearPaginaNuevo(app),
  crearPaginaRecomendaciones(app)
].map((p) => [p.id, p]));

iniciarMenu();
iniciarDetalle();
Object.values(paginas).forEach((p) => p.montar());
Object.values(paginas).forEach((p) => p.mostrar());
seguirSeccionVisible();
