/* ==========================================================
   ReportaCampus · Lógica de la interfaz
   ========================================================== */
(function () {
  'use strict';

  const D = window.RC_DATA;
  const C = window.RC_CHARTS;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const estado = {
    periodo: 'mes',
    filtros: { texto: '', estado: '', categoria: '', zona: '' },
    visibles: 10,
    nuevoId: null
  };

  const categoria = Object.fromEntries(D.categorias.map((c) => [c.id, c]));
  const zona = Object.fromEntries(D.ubicaciones.map((u) => [u.id, u]));
  const fFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  const fFechaHora = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const fNum = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });
  const horas = (a, b) => (b - a) / D.HORA;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CLASE = { 'Nuevo': 'nuevo', 'En proceso': 'proceso', 'Resuelto': 'resuelto' };
  const estadoHTML = (e) => '<span class="state state--' + CLASE[e] + '">' + e + '</span>';

  function rango(periodo) {
    const b = C.intervalos(periodo, D.ahora);
    const desde = b[0].desde;
    return { desde, previo: new Date(desde - (D.ahora - desde)) };
  }

  // ---------- Indicadores ----------
  function pintarIndicadores() {
    const r = rango(estado.periodo);
    const todos = D.incidencias;
    const actuales = todos.filter((x) => x.creado >= r.desde);
    const anteriores = todos.filter((x) => x.creado >= r.previo && x.creado < r.desde);
    const abiertos = todos.filter((x) => x.estado !== 'Resuelto');
    const nuevos = abiertos.filter((x) => x.estado === 'Nuevo').length;
    const tiempos = todos.filter((x) => x.resuelto && x.resuelto >= r.desde).map((x) => horas(x.creado, x.resuelto));

    $('#sTotal').textContent = actuales.length;
    if (anteriores.length) {
      const dif = actuales.length - anteriores.length;
      $('#sTotalNote').textContent = (dif === 0 ? 'Igual que' : Math.abs(dif) + (dif > 0 ? ' más que' : ' menos que')) + ' el periodo anterior';
    }

    $('#sAbiertos').textContent = abiertos.length;
    $('#sAbiertosNote').textContent = nuevos + (nuevos === 1 ? ' sin asignar, ' : ' sin asignar, ') + (abiertos.length - nuevos) + ' en proceso';

    const prom = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;
    $('#sTiempo').textContent = tiempos.length ? fNum.format(prom) : '–';
    $('#sTiempoNote').textContent = prom <= D.META_HORAS ? 'Dentro del límite de 48 horas' : 'Por encima del límite de 48 horas';

    const pct = tiempos.length ? Math.round(tiempos.filter((t) => t <= D.META_HORAS).length / tiempos.length * 100) : 0;
    $('#sMeta').textContent = pct;
    $('#sMetaBar').style.width = pct + '%';

    const sub = { semana: 'Por día, últimos 7 días', mes: 'Por semana, últimas 4 semanas', semestre: 'Por mes, últimos 6 meses (el último mes va en curso)' };
    $('#chartSub').textContent = sub[estado.periodo];
    $('#periodRange').textContent = fFecha.format(r.desde) + ' a ' + fFecha.format(D.ahora);
  }

  // ---------- Gráficas ----------
  function pintarGraficas() {
    const r = rango(estado.periodo);
    const serie = C.dibujarTendencia($('#trendChart'), estado.periodo, D.incidencias, D.ahora);
    $('#trendTable').innerHTML = '<table class="table table--small"><thead><tr><th scope="col">Intervalo</th><th scope="col">Recibidos</th><th scope="col">Resueltos</th></tr></thead><tbody>' +
      serie.intervalos.map((it, i) => '<tr><td>' + esc(it.etiquetaLarga) + '</td><td>' + serie.creados[i] + '</td><td>' + serie.resueltos[i] + '</td></tr>').join('') +
      '</tbody></table>';

    C.dibujarCategorias($('#catChart'), D.incidencias.filter((x) => x.creado >= r.desde), estado.filtros.categoria, (id) => {
      estado.filtros.categoria = estado.filtros.categoria === id ? '' : id;
      $('#fCategoria').value = estado.filtros.categoria;
      estado.visibles = 10;
      pintarTabla();
      pintarGraficas();
      if (estado.filtros.categoria) $('#reportes').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---------- Metas ----------
  function pintarMetas() {
    const r = rango('semestre');
    const lista = D.incidencias.filter((x) => x.creado >= r.desde);
    const resueltos = lista.filter((x) => x.resuelto);
    const asignados = lista.filter((x) => x.historial.length > 1);
    const pct = (a, b) => Math.round(a / Math.max(1, b) * 100);
    const metas = [
      { nombre: 'Resolver en menos de 48 horas', valor: pct(resueltos.filter((x) => horas(x.creado, x.resuelto) <= D.META_HORAS).length, resueltos.length), meta: 85 },
      { nombre: 'Asignar responsable en menos de 8 horas', valor: pct(asignados.filter((x) => horas(x.historial[0].fecha, x.historial[1].fecha) <= 8).length, asignados.length), meta: 90 },
      { nombre: 'Reportes con foto', valor: pct(lista.filter((x) => x.foto).length, lista.length), meta: 60 }
    ];
    $('#goals').innerHTML = metas.map((m) => {
      const ok = m.valor >= m.meta;
      return '<li><div class="goal__row"><span>' + m.nombre + '</span><strong>' + m.valor + ' %</strong></div>' +
        '<div class="bar" role="progressbar" aria-label="' + m.nombre + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + m.valor + '">' +
        '<span class="bar__fill' + (ok ? ' bar__fill--ok' : '') + '" style="width:' + m.valor + '%"></span><span class="bar__goal" style="left:' + m.meta + '%"></span></div>' +
        '<p class="goal__note">' + (ok ? 'Meta de ' + m.meta + ' % cumplida' : 'Meta ' + m.meta + ' %, faltan ' + (m.meta - m.valor) + ' puntos') + '</p></li>';
    }).join('');
  }

  // ---------- Tabla de reportes ----------
  function filtrar() {
    const f = estado.filtros;
    const t = f.texto.trim().toLowerCase();
    return D.incidencias.filter((x) =>
      (!f.estado || x.estado === f.estado) &&
      (!f.categoria || x.categoria === f.categoria) &&
      (!f.zona || x.ubicacion === f.zona) &&
      (!t || (x.id + ' ' + x.titulo + ' ' + zona[x.ubicacion].nombre).toLowerCase().includes(t))
    );
  }

  function pintarTabla() {
    const lista = filtrar();
    const vista = lista.slice(0, estado.visibles);
    $('#tbody').innerHTML = vista.length ? vista.map((x) =>
      '<tr tabindex="0" data-id="' + x.id + '"' + (x.id === estado.nuevoId ? ' class="is-new"' : '') + '>' +
      '<td class="t-code" data-label="Código">' + x.id + '</td>' +
      '<td class="t-title" data-label="Incidencia">' + esc(x.titulo) + (x.prioridad === 'Alta' ? ' <span class="urgent">Urgente</span>' : '') + '</td>' +
      '<td data-label="Categoría">' + categoria[x.categoria].nombre + '</td>' +
      '<td data-label="Zona">' + zona[x.ubicacion].nombre + '</td>' +
      '<td data-label="Fecha">' + fFecha.format(x.creado) + '</td>' +
      '<td data-label="Estado">' + estadoHTML(x.estado) + '</td></tr>'
    ).join('') : '<tr class="empty"><td colspan="6">Ningún reporte coincide con los filtros. Prueba con otra búsqueda o quita los filtros.</td></tr>';
    $('#conteo').textContent = vista.length + ' de ' + lista.length + ' reportes';
    $('#verMas').hidden = vista.length >= lista.length;
  }

  // ---------- Zonas ----------
  function pintarZonas() {
    $('#zonas-lista').innerHTML = D.ubicaciones.map((u) => {
      const abiertos = D.incidencias.filter((x) => x.ubicacion === u.id && x.estado !== 'Resuelto');
      const urgentes = abiertos.filter((x) => x.prioridad === 'Alta').length;
      const nivel = abiertos.length === 0 ? 'ok' : (urgentes ? 'alta' : 'media');
      const texto = abiertos.length === 0 ? 'Sin reportes abiertos'
        : abiertos.length + (abiertos.length === 1 ? ' reporte abierto' : ' reportes abiertos') + (urgentes ? ', ' + urgentes + ' urgente' + (urgentes > 1 ? 's' : '') : '');
      return '<button type="button" class="zone zone--' + nivel + '" data-zona="' + u.id + '">' +
        '<span class="zone__name">' + u.nombre + '</span><span class="zone__detail">' + u.detalle + '</span>' +
        '<span class="zone__count">' + abiertos.length + '</span><span class="zone__text">' + texto + '</span></button>';
    }).join('');
  }

  // ---------- Recomendaciones ----------
  function pintarRecomendaciones() {
    $('#tips').innerHTML = D.recomendaciones.map((t) => '<div><dt>' + t.titulo + '</dt><dd>' + t.texto + '</dd></div>').join('');
  }

  // ---------- Detalle ----------
  function abrir(id) {
    const x = D.incidencias.find((i) => i.id === id);
    if (!x) return;
    $('#dCodigo').innerHTML = x.id + ' ' + estadoHTML(x.estado);
    $('#dTitulo').textContent = x.titulo;
    const datos = [
      ['Categoría', categoria[x.categoria].nombre],
      ['Zona', zona[x.ubicacion].nombre + ', ' + zona[x.ubicacion].detalle.toLowerCase()],
      ['Prioridad', x.prioridad],
      ['Responsable', x.responsable || 'Sin asignar'],
      ['Reportado', fFechaHora.format(x.creado)],
      [x.resuelto ? 'Resuelto en' : 'Abierto hace', fNum.format(horas(x.creado, x.resuelto || new Date())) + ' horas']
    ];
    $('#dDatos').innerHTML = datos.map((d) => '<div><dt>' + d[0] + '</dt><dd>' + esc(d[1]) + '</dd></div>').join('');
    $('#dDesc').textContent = x.descripcion;
    $('#dHistorial').innerHTML = x.historial.map((h) =>
      '<li class="history--' + CLASE[h.estado] + '"><strong>' + h.estado + '</strong> <time>' + fFechaHora.format(h.fecha) + '</time><p>' + esc(h.nota) + '</p></li>'
    ).join('');
    const d = $('#detalle');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  // ---------- Formulario ----------
  function marcar(id, ok) {
    $('#' + id).classList.toggle('invalid', !ok);
    $('#' + id).setAttribute('aria-invalid', String(!ok));
    $('.error[data-for="' + id + '"]').classList.toggle('show', !ok);
    return ok;
  }

  function enviar(e) {
    e.preventDefault();
    const cat = $('#rCategoria').value, zon = $('#rZona').value;
    const titulo = $('#rTitulo').value.trim(), desc = $('#rDesc').value.trim();
    const ok = [marcar('rCategoria', !!cat), marcar('rZona', !!zon), marcar('rTitulo', titulo.length >= 8), marcar('rDesc', desc.length >= 15)].every(Boolean);
    if (!ok) { $('.invalid').focus(); return; }

    const ahora = new Date();
    const r = {
      id: D.siguienteId(), titulo, descripcion: desc, categoria: cat, ubicacion: zon,
      prioridad: $('input[name="rPrioridad"]:checked').value,
      estado: 'Nuevo', creado: ahora, resuelto: null, responsable: null, autor: 'Estudiante',
      foto: $('#rFoto').files.length > 0,
      historial: [{ estado: 'Nuevo', fecha: ahora, nota: 'Reporte enviado desde la plataforma.', por: 'Estudiante' }]
    };
    D.incidencias.unshift(r);
    estado.nuevoId = r.id;
    estado.filtros = { texto: '', estado: '', categoria: '', zona: '' };
    ['#fTexto', '#fEstado', '#fCategoria', '#fZona'].forEach((s) => { $(s).value = ''; });
    estado.visibles = 10;
    e.target.reset();
    actualizar();
    aviso('Reporte enviado. Tu código es ' + r.id + '.');
    $('#reportes').scrollIntoView({ behavior: 'smooth' });
  }

  let tAviso;
  function aviso(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(tAviso);
    tAviso = setTimeout(() => t.classList.remove('show'), 3500);
  }

  function actualizar() {
    pintarIndicadores();
    pintarGraficas();
    pintarMetas();
    pintarTabla();
    pintarZonas();
  }

  // ---------- Navegación ----------
  function navegacion() {
    const btn = $('#menuBtn'), side = $('#sidebar'), scrim = $('#scrim');
    const cerrar = () => { side.classList.remove('open'); scrim.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const abierto = side.classList.toggle('open');
      scrim.hidden = !abierto;
      btn.setAttribute('aria-expanded', String(abierto));
    });
    scrim.addEventListener('click', cerrar);
    $$('.nav-link').forEach((a) => a.addEventListener('click', cerrar));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });

    if ('IntersectionObserver' in window) {
      const links = Object.fromEntries($$('.nav-link').map((a) => [a.hash.slice(1), a]));
      const io = new IntersectionObserver((ents) => ents.forEach((en) => {
        if (en.isIntersecting && links[en.target.id]) {
          $$('.nav-link').forEach((a) => a.classList.remove('is-active'));
          links[en.target.id].classList.add('is-active');
        }
      }), { rootMargin: '-40% 0px -55% 0px' });
      $$('.block').forEach((s) => io.observe(s));
    }
  }

  // ---------- Inicio ----------
  document.addEventListener('DOMContentLoaded', () => {
    const optCat = D.categorias.map((c) => '<option value="' + c.id + '">' + c.nombre + '</option>').join('');
    const optZona = D.ubicaciones.map((u) => '<option value="' + u.id + '">' + u.nombre + '</option>').join('');
    $('#fCategoria').insertAdjacentHTML('beforeend', optCat);
    $('#rCategoria').insertAdjacentHTML('beforeend', optCat);
    $('#fZona').insertAdjacentHTML('beforeend', optZona);
    $('#rZona').insertAdjacentHTML('beforeend', optZona);

    navegacion();

    $$('#periodTabs button').forEach((b) => b.addEventListener('click', () => {
      estado.periodo = b.dataset.period;
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

    let espera;
    $('#fTexto').addEventListener('input', (e) => {
      clearTimeout(espera);
      espera = setTimeout(() => { estado.filtros.texto = e.target.value; estado.visibles = 10; pintarTabla(); }, 150);
    });
    [['#fEstado', 'estado'], ['#fCategoria', 'categoria'], ['#fZona', 'zona']].forEach(([sel, k]) => {
      $(sel).addEventListener('change', (e) => {
        estado.filtros[k] = e.target.value;
        estado.visibles = 10;
        pintarTabla();
        if (k === 'categoria') pintarGraficas();
      });
    });
    $('#fLimpiar').addEventListener('click', () => {
      estado.filtros = { texto: '', estado: '', categoria: '', zona: '' };
      ['#fTexto', '#fEstado', '#fCategoria', '#fZona'].forEach((s) => { $(s).value = ''; });
      estado.visibles = 10;
      pintarTabla();
      pintarGraficas();
    });
    $('#verMas').addEventListener('click', () => { estado.visibles += 10; pintarTabla(); });

    $('#tbody').addEventListener('click', (e) => { const f = e.target.closest('tr[data-id]'); if (f) abrir(f.dataset.id); });
    $('#tbody').addEventListener('keydown', (e) => {
      const f = e.target.closest('tr[data-id]');
      if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrir(f.dataset.id); }
    });
    $('#dCerrar').addEventListener('click', () => $('#detalle').close());
    $('#detalle').addEventListener('click', (e) => { if (e.target.id === 'detalle') $('#detalle').close(); });

    $('#zonas-lista').addEventListener('click', (e) => {
      const z = e.target.closest('[data-zona]');
      if (!z) return;
      estado.filtros.zona = z.dataset.zona;
      $('#fZona').value = z.dataset.zona;
      estado.visibles = 10;
      pintarTabla();
      $('#reportes').scrollIntoView({ behavior: 'smooth' });
    });

    $('#form').addEventListener('submit', enviar);
    $('#form').addEventListener('reset', () => {
      $$('.invalid').forEach((x) => x.classList.remove('invalid'));
      $$('.error').forEach((x) => x.classList.remove('show'));
    });
    ['rCategoria', 'rZona', 'rTitulo', 'rDesc'].forEach((id) => {
      $('#' + id).addEventListener('input', () => { if ($('#' + id).classList.contains('invalid')) marcar(id, true); });
    });

    pintarRecomendaciones();
    actualizar();
  });
})();
