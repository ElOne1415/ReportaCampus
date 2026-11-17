/* ==========================================================
   Página: Nuevo reporte
   Formulario con validación, foto opcional y vista previa.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { CATEGORIAS, ZONAS } from '../models/catalogos.js';
import { $, $$, agregarOpciones } from '../utils/dom.js';
import { plural } from '../utils/formato.js';
import { reducirImagen } from '../utils/imagen.js';

// Campo del modelo → id del control en el formulario
const CONTROLES = { categoria: 'rCategoria', ubicacion: 'rZona', titulo: 'rTitulo', descripcion: 'rDesc' };

export function crearPaginaNuevo(app) {
  let fotoActual = null;

  function marcar(campo, mensaje) {
    const id = CONTROLES[campo];
    const ctrl = $('#' + id), err = $('.error[data-for="' + id + '"]');
    ctrl.classList.toggle('invalid', !!mensaje);
    ctrl.setAttribute('aria-invalid', String(!!mensaje));
    if (mensaje) err.textContent = mensaje;
    err.classList.toggle('show', !!mensaje);
  }

  function limpiarErrores() {
    Object.keys(CONTROLES).forEach((c) => marcar(c, null));
  }

  function quitarFoto() {
    fotoActual = null;
    $('#rFoto').value = '';
    $('#fotoPrevia').hidden = true;
    $('#fotoImg').removeAttribute('src');
  }

  async function elegirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) { quitarFoto(); return; }
    if (!archivo.type.startsWith('image/')) { quitarFoto(); app.aviso('El archivo debe ser una imagen.'); return; }
    try {
      fotoActual = await reducirImagen(archivo, CONFIG.FOTO_MAX_PX);
      $('#fotoImg').src = fotoActual;
      $('#fotoNombre').textContent = archivo.name;
      $('#fotoPrevia').hidden = false;
    } catch (err) {
      quitarFoto();
      app.aviso('No se pudo leer la imagen.');
    }
  }

  async function pintarGuardados() {
    const n = await app.reportes.contarPropios();
    $('#guardados').hidden = n === 0;
    $('#guardadosTexto').textContent = 'Tienes ' + plural(n, 'reporte guardado', 'reportes guardados') + ' en este navegador.';
  }

  async function enviar(e) {
    e.preventDefault();
    const datos = {
      categoria: $('#rCategoria').value,
      ubicacion: $('#rZona').value,
      titulo: $('#rTitulo').value,
      descripcion: $('#rDesc').value,
      prioridad: $('input[name="rPrioridad"]:checked').value,
      fotoUrl: fotoActual
    };
    const res = await app.reportes.crear(datos, { nombre: 'Estudiante' });
    limpiarErrores();
    if (!res.ok) {
      Object.entries(res.errores).forEach(([c, m]) => { if (CONTROLES[c]) marcar(c, m); });
      const primero = $('.invalid');
      if (primero) primero.focus();
      return;
    }
    e.target.reset();
    quitarFoto();
    app.aviso('Reporte enviado. Tu código es ' + res.reporte.id + '.' + (res.guardado ? '' : ' No se pudo guardar en este navegador.'));
    app.irA('reportes', { resaltar: res.reporte.id });
  }

  return {
    id: 'nuevo',
    montar() {
      agregarOpciones($('#rCategoria'), CATEGORIAS.map((c) => ({ value: c.id, label: c.nombre })));
      agregarOpciones($('#rZona'), ZONAS.map((z) => ({ value: z.id, label: z.nombre })));
      $('#form').addEventListener('submit', enviar);
      $('#rFoto').addEventListener('change', elegirFoto);
      $('#fotoQuitar').addEventListener('click', quitarFoto);
      $('#form').addEventListener('reset', () => { quitarFoto(); limpiarErrores(); });
      Object.entries(CONTROLES).forEach(([c, id]) => {
        $('#' + id).addEventListener('input', () => { if ($('#' + id).classList.contains('invalid')) marcar(c, null); });
      });
      $('#borrarGuardados').addEventListener('click', async () => {
        await app.reportes.borrarPropios();
        pintarGuardados();
        app.aviso('Se borraron tus reportes guardados.');
      });
    },
    async mostrar() { await pintarGuardados(); }
  };
}
