/* Formatos de fecha, número y texto para la interfaz */
import { CONFIG } from '../config/config.js';

export const fFecha = new Intl.DateTimeFormat(CONFIG.LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
export const fFechaHora = new Intl.DateTimeFormat(CONFIG.LOCALE, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const fNum = new Intl.NumberFormat(CONFIG.LOCALE, { maximumFractionDigits: 1 });

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto antes de insertarlo como HTML. */
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ENTIDADES[c]);

/** "1 reporte" / "3 reportes" */
export const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

/** Fecha local en formato AAAA-MM-DD HH:MM (para archivos). */
export function fechaISOlocal(f) {
  if (!f) return '';
  const dos = (n) => String(n).padStart(2, '0');
  return f.getFullYear() + '-' + dos(f.getMonth() + 1) + '-' + dos(f.getDate()) + ' ' + dos(f.getHours()) + ':' + dos(f.getMinutes());
}
