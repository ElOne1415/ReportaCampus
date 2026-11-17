/* ==========================================================
   Página: Mis reportes (estudiante)
   Resumen por estado y lista de los reportes del usuario.
   ========================================================== */
import { LISTA_ESTADOS, ESTADOS } from '../models/catalogos.js';
import { plural } from '../utils/formato.js';
import { $, agregarOpciones } from '../utils/dom.js';
import { montarTablaReportes } from '../components/tabla-reportes.js';
import { pintarResumenEstados } from '../components/resumen-estados.js';

export function crearPaginaMisReportes(app) {
  let tabla;
  let estado = '';

  async function pintar(opciones) {
    const mios = await app.reportes.listar({ autorId: app.usuario.id });
    pintarResumenEstados($('#misResumen'), mios, {
      seleccion: estado,
      etiquetaTotal: 'Mis reportes',
      alElegir: (e) => { estado = e; $('#misEstado').value = e; pintar(); }
    });
    tabla.mostrar(estado ? mios.filter((x) => x.estado === estado) : mios, opciones);
    const porCalificar = mios.filter((x) => x.estado === ESTADOS.RESUELTO && !x.calificacion).length;
    $('#misPorCalificar').hidden = !porCalificar;
    $('#misPorCalificar').textContent = 'Tienes ' + plural(porCalificar, 'reporte resuelto', 'reportes resueltos') + ' sin calificar. Abre uno para contar cómo quedó la solución.';
  }

  return {
    id: 'mis-reportes',
    montar() {
      agregarOpciones($('#misEstado'), LISTA_ESTADOS.map((e) => ({ value: e, label: e })));
      $('#misEstado').addEventListener('change', (e) => { estado = e.target.value; pintar(); });
      tabla = montarTablaReportes($('#tablaMis'), {
        etiqueta: 'Mis reportes',
        vacio: 'No tienes reportes con este estado. Cuando reportes algo aparecerá aquí.',
        alAbrir: app.abrirReporte
      });
    },
    async mostrar(params = {}) {
      if (params.resaltar) { estado = ''; $('#misEstado').value = ''; }
      await pintar({ resaltar: params.resaltar, conservarPagina: !!params.conservar });
    }
  };
}
