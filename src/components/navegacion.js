/* ==========================================================
   Componente: menú lateral
   En celular se abre con el botón de menú y se cierra con el
   fondo oscuro, la tecla Escape o al elegir una opción.
   ========================================================== */
import { $, $$ } from '../utils/dom.js';
import { esc } from '../utils/formato.js';
import { INFO_ROLES } from '../models/roles.js';

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

/** Marca como activo el enlace de la página actual. */
export function marcarActivo(nombre) {
  $$('.nav-link').forEach((a) => {
    const activo = a.dataset.ruta === nombre;
    a.classList.toggle('is-active', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/** Dibuja los enlaces del menú: [{ ruta, texto }] */
export function pintarMenu(enlaces) {
  $('#menu').innerHTML = enlaces.map((e) =>
    '<li><a href="#/' + e.ruta + '" data-ruta="' + e.ruta + '" class="nav-link">' + esc(e.texto) + '</a></li>').join('');
}

/** Muestra el nombre y el rol del usuario en la barra superior (o lo oculta). */
export function pintarUsuario(u) {
  $('#usuarioActual').hidden = !u;
  $('.topbar').classList.toggle('topbar--sesion', !!u);
  if (!u) return;
  $('#usuarioNombre').textContent = u.nombre;
  const rol = $('#usuarioRol');
  rol.textContent = INFO_ROLES[u.rol].nombre;
  rol.className = 'role-badge role-badge--' + u.rol;
}
