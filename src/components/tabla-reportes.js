/* ==========================================================
   Componente: tabla de reportes
   ----------------------------------------------------------
   Tabla paginada que se reutiliza en las listas de reportes.
   Las columnas se eligen al montarla.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { categoriaPorId, zonaPorId } from '../models/catalogos.js';
import { esc, fFecha, fNum } from '../utils/formato.js';
import { horasEntre } from '../utils/tiempo.js';
import { estadoHTML, urgenteHTML, vencidoHTML } from './estado.js';

const COLUMNAS = {
  codigo:      { titulo: 'Código',      celda: (x) => '<td class="t-code" data-label="Código">' + x.id + '</td>' },
  incidencia:  { titulo: 'Incidencia',  celda: (x) => '<td class="t-title" data-label="Incidencia">' + esc(x.titulo) + urgenteHTML(x.prioridad) + vencidoHTML(x) + '</td>' },
  categoria:   { titulo: 'Categoría',   celda: (x) => '<td data-label="Categoría">' + categoriaPorId[x.categoria].nombre + '</td>' },
  zona:        { titulo: 'Zona',        celda: (x) => '<td data-label="Zona">' + zonaPorId[x.ubicacion].nombre + '</td>' },
  fecha:       { titulo: 'Fecha',       celda: (x) => '<td data-label="Fecha">' + fFecha.format(x.creado) + '</td>' },
  estado:      { titulo: 'Estado',      celda: (x) => '<td data-label="Estado">' + estadoHTML(x.estado) + '</td>' },
  prioridad:   { titulo: 'Prioridad',   celda: (x) => '<td data-label="Prioridad">' + x.prioridad + '</td>' },
  abierto:     { titulo: 'Tiempo',      celda: (x) => '<td data-label="Tiempo">' + tiempo(x) + '</td>' }
};

/** "Hace 5 h", "Hace 2 días" o "Resuelto en 30 h" */
function tiempo(x) {
  if (x.resuelto) return 'Resuelto en ' + fNum.format(Math.round(horasEntre(x.creado, x.resuelto))) + ' h';
  const h = horasEntre(x.creado, new Date());
  return h < 48 ? 'Hace ' + Math.max(1, Math.round(h)) + ' h' : 'Hace ' + Math.round(h / 24) + ' días';
}

export const COLUMNAS_BASE = ['codigo', 'incidencia', 'categoria', 'zona', 'fecha', 'estado'];

/**
 * Monta una tabla de reportes dentro de `contenedor`.
 * @param {HTMLElement} contenedor
 * @param {{ columnas?: string[], vacio?: string, alAbrir: (id: string) => void, etiqueta?: string }} op
 */
export function montarTablaReportes(contenedor, op) {
  const columnas = (op.columnas || COLUMNAS_BASE).map((c) => COLUMNAS[c]);
  contenedor.classList.add('panel', 'panel--flush');
  contenedor.innerHTML =
    '<table class="table table--reportes"' + (op.etiqueta ? ' aria-label="' + esc(op.etiqueta) + '"' : '') + '><thead><tr>' +
    columnas.map((c) => '<th scope="col">' + c.titulo + '</th>').join('') +
    '</tr></thead><tbody></tbody></table>' +
    '<div class="table__foot"><span class="table__count"></span><button type="button" class="btn btn--secondary table__more">Mostrar ' + CONFIG.TAMANO_PAGINA + ' más</button></div>';

  const tbody = contenedor.querySelector('tbody');
  const conteo = contenedor.querySelector('.table__count');
  const verMas = contenedor.querySelector('.table__more');
  let lista = [];
  let visibles = CONFIG.TAMANO_PAGINA;
  let resaltado = null;

  function pintar() {
    const vista = lista.slice(0, visibles);
    tbody.innerHTML = vista.length ? vista.map((x) =>
      '<tr tabindex="0" data-id="' + x.id + '"' + (x.id === resaltado ? ' class="is-new"' : '') + '>' + columnas.map((c) => c.celda(x)).join('') + '</tr>'
    ).join('') : '<tr class="empty"><td colspan="' + columnas.length + '">' + (op.vacio || 'No hay reportes.') + '</td></tr>';
    conteo.textContent = vista.length + ' de ' + lista.length + ' reportes';
    verMas.hidden = vista.length >= lista.length;
  }

  verMas.addEventListener('click', () => { visibles += CONFIG.TAMANO_PAGINA; pintar(); });
  tbody.addEventListener('click', (e) => { const f = e.target.closest('tr[data-id]'); if (f) op.alAbrir(f.dataset.id); });
  tbody.addEventListener('keydown', (e) => {
    const f = e.target.closest('tr[data-id]');
    if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); op.alAbrir(f.dataset.id); }
  });

  return {
    /** Muestra una lista nueva; vuelve a la primera página salvo que se indique. */
    mostrar(nueva, { conservarPagina = false, resaltar = null } = {}) {
      lista = nueva;
      resaltado = resaltar;
      if (!conservarPagina) visibles = CONFIG.TAMANO_PAGINA;
      pintar();
    }
  };
}
