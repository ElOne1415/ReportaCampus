/* ==========================================================
   Página: Nuevo reporte / Editar reporte
   Formulario con validación, foto opcional y vista previa.
   Con #/nuevo?editar=RC-0001 el autor edita su reporte
   mientras sigue en estado Nuevo.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { CATEGORIAS, ZONAS } from '../models/catalogos.js';
import { $, $$, agregarOpciones } from '../utils/dom.js';
import { reducirImagen } from '../utils/imagen.js';
import { puedeEditarReporte } from '../models/roles.js';

// Campo del modelo → id del control en el formulario
const CONTROLES = { categoria: 'rCategoria', ubicacion: 'rZona', titulo: 'rTitulo', descripcion: 'rDesc' };

export function crearPaginaNuevo(app) {
  let fotoActual = null;
  let editando = null; // reporte que se está editando, o null

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

  function mostrarFoto(url, nombre) {
    fotoActual = url;
    $('#fotoImg').src = url;
    $('#fotoNombre').textContent = nombre;
    $('#fotoPrevia').hidden = false;
  }

  /** Cambia los textos del formulario entre crear y editar. */
  function modo(r) {
    editando = r;
    $('#t-nuevo').textContent = r ? 'Editar reporte ' + r.id : 'Nuevo reporte';
    $('#nuevoSub').textContent = r ? 'Puedes cambiarlo mientras nadie lo ha tomado. El cambio queda en el historial.'
      : 'Cuéntanos qué pasa y dónde. Al enviarlo recibes un código para consultar su estado.';
    $('#rEnviar').textContent = r ? 'Guardar cambios' : 'Enviar reporte';
    $('#rCancelar').hidden = !r;
    $('#rBorrar').hidden = !!r;
    document.title = (r ? 'Editar reporte' : 'Nuevo reporte') + ' · ReportaCampus';
  }

  function llenar(r) {
    $('#rCategoria').value = r.categoria;
    $('#rZona').value = r.ubicacion;
    $('#rTitulo').value = r.titulo;
    $('#rDesc').value = r.descripcion;
    $('input[name="rPrioridad"][value="' + r.prioridad + '"]').checked = true;
    if (r.fotoUrl) mostrarFoto(r.fotoUrl, 'Foto adjunta'); else quitarFoto();
  }

  async function elegirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) { quitarFoto(); return; }
    if (!archivo.type.startsWith('image/')) { quitarFoto(); app.aviso('El archivo debe ser una imagen.'); return; }
    try {
      mostrarFoto(await reducirImagen(archivo, CONFIG.FOTO_MAX_PX), archivo.name);
    } catch (err) {
      quitarFoto();
      app.aviso('No se pudo leer la imagen.');
    }
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
    const res = editando
      ? await app.reportes.editar(editando.id, datos, app.usuario)
      : await app.reportes.crear(datos, app.usuario);
    limpiarErrores();
    if (!res.ok && res.error) { app.aviso(res.error); return; }
    if (!res.ok) {
      Object.entries(res.errores).forEach(([c, m]) => { if (CONTROLES[c]) marcar(c, m); });
      const primero = $('.invalid');
      if (primero) primero.focus();
      return;
    }
    const aviso = editando ? 'Se guardaron los cambios de ' + res.reporte.id + '.' : 'Reporte enviado. Tu código es ' + res.reporte.id + '.';
    e.target.reset();
    quitarFoto();
    modo(null);
    app.aviso(aviso + (res.guardado ? '' : ' No se pudo guardar en este navegador.'));
    // El estudiante vuelve a sus reportes; los demás roles, a la lista general
    app.irA(app.puede('reportes.propios') ? 'mis-reportes' : 'reportes', { resaltar: res.reporte.id });
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
      $('#rCancelar').addEventListener('click', () => { $('#form').reset(); modo(null); });
      Object.entries(CONTROLES).forEach(([c, id]) => {
        $('#' + id).addEventListener('input', () => { if ($('#' + id).classList.contains('invalid')) marcar(c, null); });
      });
    },
    async mostrar(params = {}) {
      limpiarErrores();
      if (params.editar) {
        const r = await app.reportes.obtener(params.editar);
        if (!r || !puedeEditarReporte(app.usuario, r)) {
          app.aviso('Ese reporte ya no se puede editar.');
          app.irA('mis-reportes');
          return;
        }
        $('#form').reset();
        modo(r);
        llenar(r);
      } else if (editando) {
        $('#form').reset();
        modo(null);
      }
    }
  };
}
