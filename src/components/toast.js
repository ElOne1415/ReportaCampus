/* Componente: aviso temporal en la esquina inferior */
let temporizador;

export function aviso(mensaje, duracion = 3500) {
  const t = document.getElementById('toast');
  t.textContent = mensaje;
  t.classList.add('show');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => t.classList.remove('show'), duracion);
}
