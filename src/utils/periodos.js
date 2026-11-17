/* Intervalos de tiempo para los indicadores y las gráficas */
import { CONFIG } from '../config/config.js';
import { DIA, inicioDia } from './tiempo.js';

const fmtDia = new Intl.DateTimeFormat(CONFIG.LOCALE, { weekday: 'short', day: 'numeric' });
const fmtCorto = new Intl.DateTimeFormat(CONFIG.LOCALE, { day: 'numeric', month: 'short' });
const fmtMes = new Intl.DateTimeFormat(CONFIG.LOCALE, { month: 'short' });
const fmtMesLargo = new Intl.DateTimeFormat(CONFIG.LOCALE, { month: 'long', year: 'numeric' });
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');

export const PERIODOS = Object.freeze(['semana', 'mes', 'semestre']);

/**
 * Devuelve los intervalos de un periodo.
 * Cada intervalo: { desde, hasta, etiqueta, etiquetaLarga }
 */
export function intervalos(periodo, ahora) {
  const hoy = inicioDia(ahora);
  const res = [];
  if (periodo === 'semana') {
    for (let i = 6; i >= 0; i--) {
      const desde = new Date(hoy.getTime() - i * DIA);
      const hasta = new Date(desde.getTime() + DIA);
      res.push({ desde, hasta, etiqueta: capital(fmtDia.format(desde)), etiquetaLarga: fmtCorto.format(desde) });
    }
  } else if (periodo === 'mes') {
    for (let i = 3; i >= 0; i--) {
      const hasta = new Date(hoy.getTime() + DIA - i * 7 * DIA);
      const desde = new Date(hasta.getTime() - 7 * DIA);
      const fin = new Date(hasta.getTime() - DIA);
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

/** Inicio del periodo y del periodo anterior de igual duración. */
export function rango(periodo, ahora) {
  const desde = intervalos(periodo, ahora)[0].desde;
  return { desde, previo: new Date(desde - (ahora - desde)) };
}

/** Reportes recibidos y resueltos por intervalo. */
export function serieTendencia(periodo, reportes, ahora) {
  const b = intervalos(periodo, ahora);
  const creados = b.map(() => 0);
  const resueltos = b.map(() => 0);
  reportes.forEach((x) => {
    b.forEach((it, i) => {
      if (x.creado >= it.desde && x.creado < it.hasta) creados[i]++;
      if (x.resuelto && x.resuelto >= it.desde && x.resuelto < it.hasta) resueltos[i]++;
    });
  });
  return { intervalos: b, creados, resueltos };
}
