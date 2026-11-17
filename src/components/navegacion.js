/* ==========================================================
   Componente: menú lateral
   En celular se abre con el botón de menú y se cierra con el
   fondo oscuro, la tecla Escape o al elegir una opción.
   ========================================================== */
import { $, $$ } from '../utils/dom.js';

export function iniciarMenu() {
  const btn = $('#menuBtn'), side = $('#sidebar'), scrim = $('#scrim');
  const cerrar = () => { side.classList.remove('open'); scrim.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => {
    const abierto = side.classList.toggle('open');
    scrim.hidden = !abierto;
    btn.setAttribute('aria-expanded', String(abierto));
  });
  scrim.addEventListener('click', cerrar);
  side.addEventListener('click', (e) => { if (e.target.closest('.nav-link')) cerrar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  return { cerrar };
}

/** Marca como activo el enlace de la sección visible al desplazarse. */
export function seguirSeccionVisible() {
  if (!('IntersectionObserver' in window)) return;
  const enlaces = Object.fromEntries($$('.nav-link').map((a) => [a.hash.slice(1), a]));
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting && enlaces[en.target.id]) {
      $$('.nav-link').forEach((a) => a.classList.remove('is-active'));
      enlaces[en.target.id].classList.add('is-active');
    }
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('.block').forEach((s) => io.observe(s));
}
