/* ==========================================================
   ReportaCampus · Gráficas (Chart.js)
   - Tendencia: reportes creados (barras) y resueltos (línea)
     agrupados según el periodo elegido.
   - Categorías: barras horizontales; un clic filtra la lista.
   ========================================================== */
(function () {
  'use strict';

  const D = window.RC_DATA;
  const COLORS = {
    created: '#c1272d',   // rojo: reportes recibidos
    resolved: '#3b64a0',  // azul pizarra: reportes resueltos
    catOn: '#333c4e',
    catOff: '#cfd3da',
    grid: '#ebe8e5',
    axis: '#6f777f',
    text: '#2b2b2b',
    surface: '#ffffff'
  };

  Chart.defaults.font.family = 'Lato, "Helvetica Neue", Arial, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.color = COLORS.axis;

  const fmtDia = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric' });
  const fmtCorto = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
  const fmtMes = new Intl.DateTimeFormat('es-CO', { month: 'short' });
  const fmtMesLargo = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

  const inicioDia = (f) => { const x = new Date(f); x.setHours(0, 0, 0, 0); return x; };
  const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');

  /**
   * Devuelve los intervalos (buckets) de un periodo.
   * Cada intervalo: { desde, hasta, etiqueta, etiquetaLarga }
   */
  function intervalos(periodo, ahora) {
    const hoy = inicioDia(ahora);
    const res = [];
    if (periodo === 'semana') {
      for (let i = 6; i >= 0; i--) {
        const desde = new Date(hoy.getTime() - i * D.DIA);
        const hasta = new Date(desde.getTime() + D.DIA);
        res.push({ desde, hasta, etiqueta: capital(fmtDia.format(desde)), etiquetaLarga: fmtCorto.format(desde) });
      }
    } else if (periodo === 'mes') {
      for (let i = 3; i >= 0; i--) {
        const hasta = new Date(hoy.getTime() + D.DIA - i * 7 * D.DIA);
        const desde = new Date(hasta.getTime() - 7 * D.DIA);
        const fin = new Date(hasta.getTime() - D.DIA);
        res.push({ desde, hasta, etiqueta: desde.getDate() + '–' + fin.getDate() + ' ' + fmtMes.format(fin).replace('.', ''), etiquetaLarga: fmtCorto.format(desde) + ' al ' + fmtCorto.format(fin) });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const desde = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const hasta = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1);
        const enCurso = i === 0;
        res.push({ desde, hasta, etiqueta: capital(fmtMes.format(desde)) + (enCurso ? '*' : ''), etiquetaLarga: fmtMesLargo.format(desde) + (enCurso ? ' (en curso)' : '') });
      }
    }
    return res;
  }

  function serieTendencia(periodo, incidencias, ahora) {
    const b = intervalos(periodo, ahora);
    const creados = b.map(() => 0);
    const resueltos = b.map(() => 0);
    incidencias.forEach((x) => {
      b.forEach((it, i) => {
        if (x.creado >= it.desde && x.creado < it.hasta) creados[i]++;
        if (x.resuelto && x.resuelto >= it.desde && x.resuelto < it.hasta) resueltos[i]++;
      });
    });
    return { intervalos: b, creados, resueltos };
  }

  let trendChart = null;
  let categoryChart = null;

  function dibujarTendencia(canvas, periodo, incidencias, ahora) {
    const s = serieTendencia(periodo, incidencias, ahora);
    const data = {
      labels: s.intervalos.map((x) => x.etiqueta),
      datasets: [
        {
          type: 'bar', label: 'Recibidos', data: s.creados, order: 2,
          backgroundColor: COLORS.created, borderRadius: { topLeft: 2, topRight: 2 }, borderSkipped: 'bottom',
          maxBarThickness: 34, categoryPercentage: 0.7, barPercentage: 0.9
        },
        {
          type: 'line', label: 'Resueltos', data: s.resueltos, order: 1,
          borderColor: COLORS.resolved, backgroundColor: COLORS.resolved, borderWidth: 2, tension: 0,
          pointRadius: 4, pointHoverRadius: 6, pointBorderColor: COLORS.surface, pointBorderWidth: 2
        }
      ]
    };
    if (trendChart) {
      trendChart.data = data;
      trendChart.$intervalos = s.intervalos;
      trendChart.update();
      return s;
    }
    trendChart = new Chart(canvas, {
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: COLORS.text, padding: 10, cornerRadius: 3, boxPadding: 4,
            titleFont: { weight: '700' },
            itemSort: (a, b) => a.datasetIndex - b.datasetIndex,
            callbacks: {
              title: (items) => {
                const it = trendChart.$intervalos[items[0].dataIndex];
                return it ? it.etiquetaLarga : items[0].label;
              },
              label: (ctx) => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y + ' reportes'
            }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { color: COLORS.grid }, ticks: { maxRotation: 0, autoSkip: true } },
          y: { beginAtZero: true, grid: { color: COLORS.grid }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } }
        }
      }
    });
    trendChart.$intervalos = s.intervalos;
    return s;
  }

  function dibujarCategorias(canvas, incidencias, seleccion, onClick) {
    const conteo = D.categorias.map((c) => ({ c, n: incidencias.filter((x) => x.categoria === c.id).length }))
      .sort((a, b) => b.n - a.n);
    const colores = conteo.map((x) => (!seleccion || seleccion === x.c.id) ? COLORS.catOn : COLORS.catOff);
    const data = {
      labels: conteo.map((x) => x.c.nombre),
      datasets: [{ label: 'Reportes', data: conteo.map((x) => x.n), backgroundColor: colores, borderRadius: 2, borderSkipped: 'start', maxBarThickness: 22 }]
    };
    if (categoryChart) {
      categoryChart.data = data;
      categoryChart.$ids = conteo.map((x) => x.c.id);
      categoryChart.update();
      return;
    }
    categoryChart = new Chart(canvas, {
      type: 'bar',
      data,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        onHover: (e, el) => { e.native.target.style.cursor = el.length ? 'pointer' : 'default'; },
        onClick: (e, el) => {
          const hit = categoryChart.getElementsAtEventForMode(e, 'y', { intersect: false }, false);
          if (hit.length) onClick(categoryChart.$ids[hit[0].index]);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'y', intersect: false,
            backgroundColor: COLORS.text, padding: 10, cornerRadius: 3,
            callbacks: { label: (ctx) => ' ' + ctx.parsed.x + ' reportes' }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: COLORS.grid }, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } },
          y: { grid: { display: false }, border: { color: COLORS.grid }, ticks: { color: COLORS.text, font: { weight: '700' } } }
        }
      }
    });
    categoryChart.$ids = conteo.map((x) => x.c.id);
  }

  window.RC_CHARTS = { intervalos, serieTendencia, dibujarTendencia, dibujarCategorias };
})();
