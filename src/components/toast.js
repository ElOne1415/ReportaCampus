/* Componente: aviso temporal en la esquina inferior (normal o de error) */
let temporizador;

/**
 * @param {string} mensaje
 * @param {{ tipo?: 'info'|'error', duracion?: number }|number} [op]
 */
export function aviso(mensaje, op = {}) {
  const { tipo = 'info', duracion = tipo === 'error' ? 6000 : 3500 } = typeof op === 'number' ? { duracion: op } : op;
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.classList.toggle('toast--error', tipo === 'error');
  t.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  t.classList.add('show');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove('show'), duracion);
}

export const avisoError = (mensaje) => aviso(mensaje, { tipo: 'error' });
