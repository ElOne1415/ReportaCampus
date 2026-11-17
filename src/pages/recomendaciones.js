/* Página: Recomendaciones para reportar y cuidar los espacios */
import { RECOMENDACIONES } from '../models/catalogos.js';
import { $ } from '../utils/dom.js';

export function crearPaginaRecomendaciones() {
  return {
    id: 'recomendaciones',
    montar() {
      $('#tips').innerHTML = RECOMENDACIONES.map((t) => '<div><dt>' + t.titulo + '</dt><dd>' + t.texto + '</dd></div>').join('');
    },
    async mostrar() {}
  };
}
