/* ==========================================================
   Página: Actividad (administrador)
   Registro de auditoría con búsqueda y filtro por acción.
   ========================================================== */
import { $, agregarOpciones } from '../utils/dom.js';
import { esc, fFechaHora, plural } from '../utils/formato.js';

export const ACCIONES = Object.freeze({
  crear: 'Creó', editar: 'Editó', eliminar: 'Eliminó', asignar: 'Asignó', tomar: 'Tomó', resolver: 'Resolvió',
  reabrir: 'Reabrió', prioridad: 'Cambió la prioridad', calificar: 'Calificó', activar: 'Activó', desactivar: 'Desactivó',
  cambiar_contrasena: 'Cambió su contraseña'
});

export function crearPaginaActividad(app) {
  let registros = [];
  const filtros = { texto: '', accion: '' };

  function pintar() {
    const t = filtros.texto.trim().toLowerCase();
    const lista = registros.filter((r) => (!filtros.accion || r.accion === filtros.accion) &&
      (!t || (r.usuario + ' ' + r.entidadId + ' ' + r.detalle).toLowerCase().includes(t)));
    $('#aTabla').innerHTML = lista.length ? lista.map((r) =>
      '<tr><td data-label="Fecha">' + fFechaHora.format(new Date(r.fecha)) + '</td>' +
      '<td data-label="Usuario">' + esc(r.usuario) + '</td>' +
      '<td data-label="Acción"><strong>' + (ACCIONES[r.accion] || esc(r.accion)) + '</strong></td>' +
      '<td data-label="Elemento">' + (r.entidad === 'reporte' ? '<a href="#" data-reporte="' + esc(r.entidadId) + '">' + esc(r.entidadId) + '</a>' : 'Cuenta ' + esc(r.entidadId)) + '</td>' +
      '<td data-label="Detalle">' + esc(r.detalle || '') + '</td></tr>'
    ).join('') : '<tr class="empty"><td colspan="5">' + (registros.length ? 'Ningún registro coincide con la búsqueda.' : 'Todavía no hay actividad registrada. Aparecerá cuando alguien cree, atienda o modifique reportes o cuentas.') + '</td></tr>';
    $('#aConteo').textContent = plural(lista.length, 'registro', 'registros');
  }

  async function cargar() {
    registros = await app.auditoria.listar(+$('#aLimite').value, app.usuario);
    pintar();
  }

  return {
    id: 'actividad',
    montar() {
      agregarOpciones($('#aAccion'), Object.entries(ACCIONES).map(([value, label]) => ({ value, label })));
      let espera;
      $('#aTexto').addEventListener('input', (e) => { clearTimeout(espera); espera = setTimeout(() => { filtros.texto = e.target.value; pintar(); }, 150); });
      $('#aAccion').addEventListener('change', (e) => { filtros.accion = e.target.value; pintar(); });
      $('#aLimite').addEventListener('change', () => cargar());
      $('#aTabla').addEventListener('click', (e) => {
        const a = e.target.closest('[data-reporte]');
        if (a) { e.preventDefault(); app.abrirReporte(a.dataset.reporte); }
      });
    },
    async mostrar() { await cargar(); }
  };
}
