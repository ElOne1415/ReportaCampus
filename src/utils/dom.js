/* Atajos para trabajar con el DOM */

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/** Llena un <select> con opciones { value, label } conservando las existentes. */
export function agregarOpciones(select, opciones) {
  select.insertAdjacentHTML('beforeend', opciones.map((o) =>
    '<option value="' + o.value + '">' + o.label + '</option>').join(''));
}
