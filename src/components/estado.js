/* Componente: etiqueta de estado de un reporte */
import { CLASE_ESTADO } from '../models/catalogos.js';

export const estadoHTML = (estado) => '<span class="state state--' + CLASE_ESTADO[estado] + '">' + estado + '</span>';
export const urgenteHTML = (prioridad) => (prioridad === 'Alta' ? ' <span class="urgent">Urgente</span>' : '');
