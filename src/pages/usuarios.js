/* ==========================================================
   Página: Usuarios (administrador)
   Registro, edición, activación y eliminación de cuentas.
   ========================================================== */
import { CATEGORIAS, categoriaPorId } from '../models/catalogos.js';
import { INFO_ROLES, LISTA_ROLES, ROLES } from '../models/roles.js';
import { $, $$, agregarOpciones, conBoton } from '../utils/dom.js';
import { esc, plural } from '../utils/formato.js';
import { confirmar } from '../components/confirmar.js';

// Campo del modelo → id del control en el formulario
const CONTROLES = { nombre: 'uNombre', correo: 'uCorreo', rol: 'uRolForm', area: 'uArea', categorias: 'uCategorias' };

export function crearPaginaUsuarios(app) {
  const filtros = { texto: '', rol: '', activo: '' };
  let editando = null;

  // ---------- Lista ----------
  async function pintar() {
    const todos = await app.usuarios.listar();
    const resumen = LISTA_ROLES.map((r) => ({ etiqueta: INFO_ROLES[r].nombre + (r === ROLES.ADMIN ? 'es' : 's'), n: todos.filter((u) => u.rol === r).length }))
      .concat([{ etiqueta: 'Inactivos', n: todos.filter((u) => !u.activo).length }]);
    $('#uResumen').innerHTML = resumen.map((r) => '<div class="summary__item"><span class="summary__label">' + r.etiqueta + '</span><span class="summary__value">' + r.n + '</span></div>').join('');

    const lista = await app.usuarios.listar({
      texto: filtros.texto,
      rol: filtros.rol,
      activo: filtros.activo === '' ? undefined : filtros.activo === 'si'
    });
    $('#uTabla').innerHTML = lista.length ? lista.map((u) => {
      const yo = u.id === app.usuario.id;
      return '<tr data-id="' + u.id + '"' + (u.activo ? '' : ' class="is-off"') + '>' +
        '<td data-label="Nombre"><span class="u-name">' + esc(u.nombre) + (yo ? ' (tú)' : '') + '</span><span class="u-mail">' + esc(u.correo) + '</span></td>' +
        '<td data-label="Rol"><span class="role-badge role-badge--' + u.rol + '">' + INFO_ROLES[u.rol].nombre + '</span></td>' +
        '<td data-label="Área">' + (u.area ? '<span class="u-area">' + esc(u.area) + '</span><span class="u-cats">' + u.categorias.map((c) => categoriaPorId[c].nombre).join(', ') + '</span>' : '<span class="u-cats">—</span>') + '</td>' +
        '<td data-label="Estado"><span class="u-state' + (u.activo ? '' : ' u-state--off') + '">' + (u.activo ? 'Activo' : 'Inactivo') + '</span></td>' +
        '<td class="u-actions-cell"><div class="u-actions">' +
        '<button type="button" class="btn btn--secondary btn--small" data-accion="editar">Editar</button>' +
        (yo ? '' : '<button type="button" class="btn btn--secondary btn--small" data-accion="activo">' + (u.activo ? 'Desactivar' : 'Activar') + '</button>' +
          '<button type="button" class="btn btn--danger btn--small" data-accion="eliminar">Eliminar</button>') +
        '</div></td></tr>';
    }).join('') : '<tr class="empty"><td colspan="5">Ningún usuario coincide con la búsqueda.</td></tr>';
    $('#uConteo').textContent = plural(lista.length, 'usuario', 'usuarios') + (lista.length !== todos.length ? ' de ' + todos.length : '');
  }

  // ---------- Formulario ----------
  function marcar(campo, mensaje) {
    const id = CONTROLES[campo];
    const ctrl = $('#' + id);
    ctrl.classList.toggle('invalid', !!mensaje);
    if (ctrl.tagName !== 'DIV') ctrl.setAttribute('aria-invalid', String(!!mensaje));
    const err = $('.error[data-for="' + id + '"]');
    err.textContent = mensaje || '';
    err.classList.toggle('show', !!mensaje);
  }

  function limpiar() {
    Object.keys(CONTROLES).forEach((c) => marcar(c, null));
    $('#uFormError').hidden = true;
  }

  function verCamposResponsable() {
    const es = $('#uRolForm').value === ROLES.RESPONSABLE;
    $$('[data-solo-responsable]').forEach((e) => { e.hidden = !es; });
  }

  function abrirFormulario(u) {
    editando = u || null;
    $('#usuarioForm').reset();
    limpiar();
    $('#uFormTitulo').textContent = u ? 'Editar usuario' : 'Nuevo usuario';
    $('#uGuardar').textContent = u ? 'Guardar cambios' : 'Crear usuario';
    if (u) {
      $('#uNombre').value = u.nombre;
      $('#uCorreo').value = u.correo;
      $('#uRolForm').value = u.rol;
      $('#uArea').value = u.area;
      $$('#uCategorias input').forEach((c) => { c.checked = u.categorias.includes(c.value); });
    }
    verCamposResponsable();
    $('#usuarioDialog').showModal();
    $('#uNombre').focus();
  }

  async function guardar(e) {
    e.preventDefault();
    const datos = {
      nombre: $('#uNombre').value,
      correo: $('#uCorreo').value,
      rol: $('#uRolForm').value,
      area: $('#uArea').value,
      categorias: $$('#uCategorias input:checked').map((c) => c.value)
    };
    const res = await conBoton($('#uGuardar'), 'Guardando…', () => (editando
      ? app.usuarios.editar(editando.id, datos, app.usuario)
      : app.usuarios.crear(datos, app.usuario)));
    limpiar();
    if (!res.ok) {
      if (res.errores) {
        Object.entries(res.errores).forEach(([c, m]) => marcar(c, m));
        const primero = $('#usuarioDialog .invalid');
        if (primero) (primero.querySelector('input') || primero).focus();
      } else {
        $('#uFormError').textContent = res.error;
        $('#uFormError').hidden = false;
      }
      return;
    }
    $('#usuarioDialog').close();
    app.aviso(editando ? 'Se guardaron los cambios de ' + res.usuario.nombre + '.' : 'Se creó la cuenta de ' + res.usuario.nombre + '.');
    // Si el administrador se editó a sí mismo, actualiza la barra superior
    if (editando && editando.id === app.usuario.id) await app.alCambiarSesion();
    pintar();
  }

  // ---------- Acciones de la tabla ----------
  async function accion(boton) {
    const u = await app.usuarios.obtener(boton.closest('tr').dataset.id);
    if (!u) return;
    if (boton.dataset.accion === 'editar') { abrirFormulario(u); return; }
    let res;
    if (boton.dataset.accion === 'activo') {
      res = await app.usuarios.cambiarActivo(u.id, !u.activo, app.usuario);
      if (res.ok) app.aviso(u.nombre + (res.usuario.activo ? ' ya puede iniciar sesión.' : ' ya no puede iniciar sesión.'));
    } else {
      const ok = await confirmar({ titulo: '¿Eliminar la cuenta de ' + u.nombre + '?', mensaje: 'Sus reportes se conservan, pero la cuenta se borra de forma permanente. Si solo quieres impedir el acceso, desactívala.', boton: 'Eliminar' });
      if (!ok) return;
      res = await app.usuarios.eliminar(u.id, app.usuario);
      if (res.ok) app.aviso('Se eliminó la cuenta de ' + u.nombre + '.');
    }
    if (!res.ok) { app.avisoError(res.error); return; }
    pintar();
  }

  async function restablecer() {
    const ok = await confirmar({ titulo: '¿Restablecer los datos de demostración?', mensaje: 'Se borran los reportes y usuarios creados o modificados en este navegador y se cargan los datos iniciales.', boton: 'Restablecer' });
    if (!ok) return;
    const r1 = await app.reportes.restablecer(app.usuario);
    const r2 = await app.usuarios.restablecer(app.usuario);
    if (!r1.ok || !r2.ok) { app.avisoError(r1.error || r2.error); return; }
    app.aviso('Se restablecieron los datos de demostración.');
    app.alCambiarSesion();
    pintar();
  }

  return {
    id: 'usuarios',
    montar() {
      const roles = LISTA_ROLES.map((r) => ({ value: r, label: INFO_ROLES[r].nombre }));
      agregarOpciones($('#uRol'), roles);
      agregarOpciones($('#uRolForm'), roles);
      $('#uCategorias').innerHTML = CATEGORIAS.map((c) => '<label><input type="checkbox" value="' + c.id + '"> ' + c.nombre + '</label>').join('');

      let espera;
      $('#uTexto').addEventListener('input', (e) => { clearTimeout(espera); espera = setTimeout(() => { filtros.texto = e.target.value; pintar(); }, 150); });
      $('#uRol').addEventListener('change', (e) => { filtros.rol = e.target.value; pintar(); });
      $('#uActivo').addEventListener('change', (e) => { filtros.activo = e.target.value; pintar(); });
      $('#uTabla').addEventListener('click', (e) => { const b = e.target.closest('[data-accion]'); if (b) accion(b); });

      $('#uNuevo').addEventListener('click', () => abrirFormulario(null));
      $('#uRolForm').addEventListener('change', () => { verCamposResponsable(); marcar('rol', null); });
      $('#usuarioForm').addEventListener('submit', guardar);
      ['uCancelar', 'uCerrar'].forEach((id) => $('#' + id).addEventListener('click', () => $('#usuarioDialog').close()));
      Object.entries(CONTROLES).forEach(([c, id]) => $('#' + id).addEventListener('input', () => marcar(c, null)));
      $('#usuarioDialog').addEventListener('click', (e) => { if (e.target.id === 'usuarioDialog') $('#usuarioDialog').close(); });
      $('#restablecer').addEventListener('click', restablecer);
    },
    async mostrar() { await pintar(); }
  };
}
