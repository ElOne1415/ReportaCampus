/* ==========================================================
   Página: Panel de incidencias
   Indicadores, gráficas y metas del periodo elegido.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { $, $$ } from '../utils/dom.js';
import { esc, fFecha, fNum } from '../utils/formato.js';
import { horasEntre } from '../utils/tiempo.js';
import { rango, PERIODOS } from '../utils/periodos.js';
import { ESTADOS } from '../models/catalogos.js';
import { superaMeta } from '../models/reporte.js';
import { dibujarTendencia, dibujarCategorias } from '../components/graficas.js';

const SUBTITULOS = { semana: 'Por día, últimos 7 días', mes: 'Por semana, últimas 4 semanas', semestre: 'Por mes, últimos 6 meses (el último mes va en curso)' };

export function crearPaginaPanel(app) {
  let periodo = 'mes';
  let reportes = [];

  function pintarIndicadores() {
    const ahora = app.reportes.ahora;
    const r = rango(periodo, ahora);
    const actuales = reportes.filter((x) => x.creado >= r.desde);
    const anteriores = reportes.filter((x) => x.creado >= r.previo && x.creado < r.desde);
    const abiertos = reportes.filter((x) => x.estado !== ESTADOS.RESUELTO);
    const nuevos = abiertos.filter((x) => x.estado === ESTADOS.NUEVO).length;
    const tiempos = reportes.filter((x) => x.resuelto && x.resuelto >= r.desde).map((x) => horasEntre(x.creado, x.resuelto));

    $('#sTotal').textContent = actuales.length;
    const dif = actuales.length - anteriores.length;
    $('#sTotalNote').textContent = anteriores.length ? (dif === 0 ? 'Igual que' : Math.abs(dif) + (dif > 0 ? ' más que' : ' menos que')) + ' el periodo anterior' : '';
    $('#sAbiertos').textContent = abiertos.length;
    const vencidos = abiertos.filter((x) => superaMeta(x, CONFIG.META_HORAS, ahora)).length;
    $('#sAbiertosNote').textContent = nuevos + ' sin asignar, ' + (abiertos.length - nuevos) + ' en proceso' + (vencidos ? '; ' + vencidos + ' con más de ' + CONFIG.META_HORAS + ' h' : '');
    // El administrador va directo a los que falta asignar
    if (nuevos && app.puede('reportes.asignar')) {
      $('#sAbiertosNote').insertAdjacentHTML('beforeend', ' · <a href="#/reportes?estado=Nuevo&responsableId=ninguno">Asignar</a>');
    }

    const prom = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;
    $('#sTiempo').textContent = tiempos.length ? fNum.format(prom) : '–';
    $('#sTiempoNote').textContent = prom <= CONFIG.META_HORAS ? 'Dentro del límite de 48 horas' : 'Por encima del límite de 48 horas';

    const pct = tiempos.length ? Math.round(tiempos.filter((t) => t <= CONFIG.META_HORAS).length / tiempos.length * 100) : 0;
    $('#sMeta').textContent = pct;
    $('#sMetaBar').style.width = pct + '%';

    $('#chartSub').textContent = SUBTITULOS[periodo];
    $('#periodRange').textContent = fFecha.format(r.desde) + ' a ' + fFecha.format(ahora);
  }

  function pintarGraficas() {
    const ahora = app.reportes.ahora;
    const r = rango(periodo, ahora);
    const serie = dibujarTendencia($('#trendChart'), periodo, reportes, ahora);
    $('#trendTable').innerHTML = '<table class="table table--small"><thead><tr><th scope="col">Intervalo</th><th scope="col">Recibidos</th><th scope="col">Resueltos</th></tr></thead><tbody>' +
      serie.intervalos.map((it, i) => '<tr><td>' + esc(it.etiquetaLarga) + '</td><td>' + serie.creados[i] + '</td><td>' + serie.resueltos[i] + '</td></tr>').join('') +
      '</tbody></table>';
    dibujarCategorias($('#catChart'), reportes.filter((x) => x.creado >= r.desde), null, (id) => {
      app.irA('reportes', { categoria: id });
    });
  }

  function pintarMetas() {
    const r = rango('semestre', app.reportes.ahora);
    const lista = reportes.filter((x) => x.creado >= r.desde);
    const resueltos = lista.filter((x) => x.resuelto);
    const asignados = lista.filter((x) => x.historial.length > 1);
    const pct = (a, b) => Math.round(a / Math.max(1, b) * 100);
    const metas = [
      { nombre: 'Resolver en menos de 48 horas', valor: pct(resueltos.filter((x) => horasEntre(x.creado, x.resuelto) <= CONFIG.META_HORAS).length, resueltos.length), meta: CONFIG.META_CUMPLIMIENTO },
      { nombre: 'Asignar responsable en menos de 8 horas', valor: pct(asignados.filter((x) => horasEntre(x.historial[0].fecha, x.historial[1].fecha) <= 8).length, asignados.length), meta: 90 },
      { nombre: 'Reportes con foto', valor: pct(lista.filter((x) => x.foto).length, lista.length), meta: 60 },
      { nombre: 'Soluciones calificadas con 4 o 5 estrellas', valor: pct(resueltos.filter((x) => x.calificacion && x.calificacion.puntaje >= 4).length, resueltos.filter((x) => x.calificacion).length), meta: 80 }
    ];
    $('#goals').innerHTML = metas.map((m) => {
      const ok = m.valor >= m.meta;
      return '<li><div class="goal__row"><span>' + m.nombre + '</span><strong>' + m.valor + ' %</strong></div>' +
        '<div class="bar" role="progressbar" aria-label="' + m.nombre + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + m.valor + '">' +
        '<span class="bar__fill' + (ok ? ' bar__fill--ok' : '') + '" style="width:' + m.valor + '%"></span><span class="bar__goal" style="left:' + m.meta + '%"></span></div>' +
        '<p class="goal__note">' + (ok ? 'Meta de ' + m.meta + ' % cumplida' : 'Meta ' + m.meta + ' %, faltan ' + (m.meta - m.valor) + ' puntos') + '</p></li>';
    }).join('');
  }

  return {
    id: 'panel',
    montar() {
      $$('#periodTabs button').forEach((b) => b.addEventListener('click', () => {
        if (!PERIODOS.includes(b.dataset.period)) return;
        periodo = b.dataset.period;
        $$('#periodTabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
        pintarIndicadores();
        pintarGraficas();
      }));
      $('#toggleTable').addEventListener('click', (e) => {
        const t = $('#trendTable');
        t.hidden = !t.hidden;
        e.currentTarget.setAttribute('aria-pressed', String(!t.hidden));
        e.currentTarget.textContent = t.hidden ? 'Ver como tabla' : 'Ocultar tabla';
      });
    },
    async mostrar() {
      reportes = await app.reportes.listar();
      pintarIndicadores();
      pintarGraficas();
      pintarMetas();
    }
  };
}
