/* ==========================================================
   Página: Reportes
   Búsqueda, filtros, tabla paginada y exportación a CSV.
   ========================================================== */
import { CATEGORIAS, ZONAS, categoriaPorId, zonaPorId } from '../models/catalogos.js';
import { $ } from '../utils/dom.js';
import { agregarOpciones } from '../utils/dom.js';
import { fNum, fechaISOlocal, plural } from '../utils/formato.js';
import { horasEntre } from '../utils/tiempo.js';
import { aCSV, descargar } from '../utils/csv.js';
import { montarTablaReportes } from '../components/tabla-reportes.js';

const CAMPOS = { texto: '#fTexto', estado: '#fEstado', categoria: '#fCategoria', zona: '#fZona' };
export const FILTROS_VACIOS = Object.freeze({ texto: '', estado: '', categoria: '', zona: '' });
const pick = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => k in FILTROS_VACIOS));

export function crearPaginaReportes(app) {
  let tabla;

  const sincronizarCampos = () => Object.entries(CAMPOS).forEach(([k, sel]) => { $(sel).value = app.estado.filtros[k]; });

  async function pintar(opciones) {
    tabla.mostrar(await app.reportes.listar(app.estado.filtros), opciones);
  }

  async function exportar() {
    const lista = await app.reportes.listar(app.estado.filtros);
    if (!lista.length) { app.aviso('No hay reportes para exportar con estos filtros.'); return; }
    const filas = [['Código', 'Incidencia', 'Categoría', 'Zona', 'Prioridad', 'Estado', 'Responsable', 'Creado', 'Resuelto', 'Horas de solución']]
      .concat(lista.map((x) => [
        x.id, x.titulo, categoriaPorId[x.categoria].nombre, zonaPorId[x.ubicacion].nombre, x.prioridad, x.estado,
        app.reportes.nombreResponsable(x), fechaISOlocal(x.creado), fechaISOlocal(x.resuelto),
        x.resuelto ? fNum.format(horasEntre(x.creado, x.resuelto)) : ''
      ]));
    descargar('reportes-' + new Date().toISOString().slice(0, 10) + '.csv', aCSV(filas));
    app.aviso('Se exportaron ' + plural(lista.length, 'reporte.', 'reportes.'));
  }

  return {
    id: 'reportes',
    montar() {
      agregarOpciones($('#fCategoria'), CATEGORIAS.map((c) => ({ value: c.id, label: c.nombre })));
      agregarOpciones($('#fZona'), ZONAS.map((z) => ({ value: z.id, label: z.nombre })));
      tabla = montarTablaReportes($('#tablaReportes'), {
        etiqueta: 'Reportes',
        vacio: 'Ningún reporte coincide con los filtros. Prueba con otra búsqueda o quita los filtros.',
        alAbrir: app.abrirReporte
      });

      let espera;
      $('#fTexto').addEventListener('input', (e) => {
        clearTimeout(espera);
        espera = setTimeout(() => { app.estado.filtros.texto = e.target.value; pintar(); }, 150);
      });
      ['estado', 'categoria', 'zona'].forEach((k) => {
        $(CAMPOS[k]).addEventListener('change', (e) => {
          app.estado.filtros[k] = e.target.value;
          pintar();
        });
      });
      $('#fLimpiar').addEventListener('click', () => {
        app.estado.filtros = { ...FILTROS_VACIOS };
        sincronizarCampos();
        pintar();
      });
      $('#exportar').addEventListener('click', exportar);
    },
    /** params: filtros a aplicar, reporte a resaltar o conservar (redibujar sin cambiar nada) */
    async mostrar(params = {}) {
      $('#exportar').hidden = !app.puede('reportes.exportar');
      // Si la ruta trae parámetros (#/reportes?zona=x) se aplican desde cero;
      // si no, se conservan los filtros que el usuario ya tenía.
      const { resaltar, conservar, ...filtros } = params;
      if (resaltar || Object.keys(filtros).length) {
        app.estado.filtros = { ...FILTROS_VACIOS, ...pick(filtros) };
        sincronizarCampos();
      }
      await pintar({ resaltar, conservarPagina: !!conservar });
    }
  };
}
