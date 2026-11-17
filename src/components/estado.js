/* Componente: etiqueta de estado de un reporte */
import { CLASE_ESTADO } from '../models/catalogos.js';
import { CONFIG } from '../config/config.js';
import { superaMeta } from '../models/reporte.js';

export const estadoHTML = (estado) => '<span class="state state--' + CLASE_ESTADO[estado] + '">' + estado + '</span>';
export const urgenteHTML = (prioridad) => (prioridad === 'Alta' ? ' <span class="urgent">Urgente</span>' : '');

/** Etiqueta para los reportes abiertos que superan la meta de atención. */
export const vencidoHTML = (x) => (superaMeta(x, CONFIG.META_HORAS) ? ' <span class="overdue">Más de ' + CONFIG.META_HORAS + ' h</span>' : '');

/** ★★★★☆ con el texto "4 de 5" para lectores de pantalla. */
export const estrellasHTML = (n) => '<span class="stars" aria-label="' + n + ' de 5">' + '★'.repeat(n) + '<span class="stars__off">' + '★'.repeat(5 - n) + '</span></span>';
