/* ==========================================================
   Componente: gráficas (Chart.js)
   - Tendencia: reportes recibidos (barras) y resueltos (línea).
   - Categorías: barras horizontales; un clic filtra la lista.
   Chart.js se carga como script global desde public/vendor/.
   ========================================================== */
import { CATEGORIAS } from '../models/catalogos.js';
import { serieTendencia } from '../utils/periodos.js';

const COLORES = {
  recibidos: '#c1272d',
  resueltos: '#3b64a0',
  catActiva: '#333c4e',
  catInactiva: '#cfd3da',
  rejilla: '#ebe8e5',
  eje: '#6f777f',
  texto: '#2b2b2b',
  superficie: '#ffffff'
};

const Chart = globalThis.Chart;
Chart.defaults.font.family = 'Lato, "Helvetica Neue", Arial, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = COLORES.eje;

let tendencia = null;
let categorias = null;

export function dibujarTendencia(canvas, periodo, reportes, ahora) {
  const s = serieTendencia(periodo, reportes, ahora);
  const data = {
    labels: s.intervalos.map((x) => x.etiqueta),
    datasets: [
      {
        type: 'bar', label: 'Recibidos', data: s.creados, order: 2,
        backgroundColor: COLORES.recibidos, borderRadius: { topLeft: 2, topRight: 2 }, borderSkipped: 'bottom',
        maxBarThickness: 34, categoryPercentage: 0.7, barPercentage: 0.9
      },
      {
        type: 'line', label: 'Resueltos', data: s.resueltos, order: 1,
        borderColor: COLORES.resueltos, backgroundColor: COLORES.resueltos, borderWidth: 2, tension: 0,
        pointRadius: 4, pointHoverRadius: 6, pointBorderColor: COLORES.superficie, pointBorderWidth: 2
      }
    ]
  };
  if (tendencia) {
    tendencia.data = data;
    tendencia.$intervalos = s.intervalos;
    tendencia.update();
    return s;
  }
  tendencia = new Chart(canvas, {
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: COLORES.texto, padding: 10, cornerRadius: 3, boxPadding: 4,
          titleFont: { weight: '700' },
          itemSort: (a, b) => a.datasetIndex - b.datasetIndex,
          callbacks: {
            title: (items) => {
              const it = tendencia.$intervalos[items[0].dataIndex];
              return it ? it.etiquetaLarga : items[0].label;
            },
            label: (ctx) => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y + ' reportes'
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: COLORES.rejilla }, ticks: { maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, grid: { color: COLORES.rejilla }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } }
      }
    }
  });
  tendencia.$intervalos = s.intervalos;
  return s;
}

export function dibujarCategorias(canvas, reportes, seleccion, alElegir) {
  const conteo = CATEGORIAS.map((c) => ({ c, n: reportes.filter((x) => x.categoria === c.id).length }))
    .sort((a, b) => b.n - a.n);
  const colores = conteo.map((x) => (!seleccion || seleccion === x.c.id) ? COLORES.catActiva : COLORES.catInactiva);
  const data = {
    labels: conteo.map((x) => x.c.nombre),
    datasets: [{ label: 'Reportes', data: conteo.map((x) => x.n), backgroundColor: colores, borderRadius: 2, borderSkipped: 'start', maxBarThickness: 22 }]
  };
  if (categorias) {
    categorias.data = data;
    categorias.$ids = conteo.map((x) => x.c.id);
    categorias.$alElegir = alElegir;
    categorias.update();
    return;
  }
  categorias = new Chart(canvas, {
    type: 'bar',
    data,
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
      onClick: (e) => {
        const hit = categorias.getElementsAtEventForMode(e, 'y', { intersect: false }, false);
        if (hit.length) categorias.$alElegir(categorias.$ids[hit[0].index]);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'y', intersect: false,
          backgroundColor: COLORES.texto, padding: 10, cornerRadius: 3,
          callbacks: { label: (ctx) => ' ' + ctx.parsed.x + ' reportes' }
        }
      },
      scales: {
        x: { beginAtZero: true, grid: { color: COLORES.rejilla }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } },
        y: { grid: { display: false }, border: { color: COLORES.rejilla }, ticks: { color: COLORES.texto, font: { weight: '700' } } }
      }
    }
  });
  categorias.$ids = conteo.map((x) => x.c.id);
  categorias.$alElegir = alElegir;
}
