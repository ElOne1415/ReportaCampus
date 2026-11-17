/* Atajos para trabajar con el DOM */

export const $ = (sel, raiz = document) => raiz.querySelector(sel);
export const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

/** Llena un <select> con opciones { value, label } conservando las existentes. */
export function agregarOpciones(select, opciones) {
  select.insertAdjacentHTML('beforeend', opciones.map((o) =>
    '<option value="' + o.value + '">' + o.label + '</option>').join(''));
}

/**
 * Desactiva el botón mientras se hace una acción, para evitar dobles
 * envíos, y muestra un texto de espera.
 */
export async function conBoton(boton, texto, accion) {
  if (!boton) return accion();
  const original = boton.textContent;
  boton.disabled = true;
  boton.setAttribute('aria-busy', 'true');
  if (texto) boton.textContent = texto;
  try {
    return await accion();
  } finally {
    boton.disabled = false;
    boton.removeAttribute('aria-busy');
    if (texto) boton.textContent = original;
  }
}
