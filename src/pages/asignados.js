/* ==========================================================
   Página: Mis asignaciones (responsable)
   Reportes a cargo del responsable, ordenados por urgencia.
   ========================================================== */
import { CONFIG } from '../config/config.js';
import { ESTADOS, categoriaPorId } from '../models/catalogos.js';
import { superaMeta } from '../models/reporte.js';
import { plural } from '../utils/formato.js';
import { $ } from '../utils/dom.js';
import { montarTablaReportes } from '../components/tabla-reportes.js';
import { pintarResumenEstados } from '../components/resumen-estados.js';

const PESO_PRIORIDAD = { Alta: 0, Media: 1, Baja: 2 };

/** Abiertos primero; entre ellos, prioridad alta y luego los más antiguos. */
export function ordenarPorUrgencia(lista) {
  return lista.slice().sort((a, b) =>
    ((a.estado === ESTADOS.RESUELTO) - (b.estado === ESTADOS.RESUELTO)) ||
    (a.estado === ESTADOS.RESUELTO ? b.resuelto - a.resuelto : (PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad]) || (a.creado - b.creado)));
}

export function crearPaginaAsignados(app) {
  let tabla, disponibles;
  let estado = ESTADOS.EN_PROCESO;

  async function pintar(opciones) {
    const mios = await app.reportes.listar({ responsableId: app.usuario.id });
    pintarResumenEstados($('#asigResumen'), mios, {
      seleccion: estado,
      etiquetaTotal: 'Asignados',
      alElegir: (e) => { estado = e; pintar(); }
    });
    tabla.mostrar(ordenarPorUrgencia(estado ? mios.filter((x) => x.estado === estado) : mios), opciones);

    // Alerta de los que llevan más de 48 horas abiertos
    const vencidos = mios.filter((x) => superaMeta(x, CONFIG.META_HORAS)).length;
    $('#asigVencidos').hidden = !vencidos;
    $('#asigVencidos').textContent = plural(vencidos, 'reporte a tu cargo lleva', 'reportes a tu cargo llevan') + ' más de ' + CONFIG.META_HORAS + ' horas abierto' + (vencidos === 1 ? '. Atiéndelo' : 's. Atiéndelos') + ' primero o agrega una nota con el motivo de la demora.';

    // Reportes nuevos sin responsable de sus categorías
    const libres = (await app.reportes.listar({ estado: ESTADOS.NUEVO, responsableId: 'ninguno' }))
      .filter((x) => app.usuario.categorias.includes(x.categoria));
    disponibles.mostrar(ordenarPorUrgencia(libres));
  }

  return {
    id: 'asignados',
    montar() {
      tabla = montarTablaReportes($('#tablaAsignados'), {
        etiqueta: 'Mis asignaciones',
        columnas: ['codigo', 'incidencia', 'zona', 'prioridad', 'abierto', 'estado'],
        vacio: 'No tienes reportes en este estado.',
        alAbrir: app.abrirReporte
      });
      disponibles = montarTablaReportes($('#tablaDisponibles'), {
        etiqueta: 'Disponibles para tomar',
        columnas: ['codigo', 'incidencia', 'categoria', 'zona', 'abierto'],
        vacio: 'No hay reportes nuevos sin asignar en tus categorías.',
        alAbrir: app.abrirReporte
      });
    },
    async mostrar(params = {}) {
      const u = app.usuario;
      $('#asigSub').textContent = u.area + ' · atiende ' + u.categorias.map((c) => categoriaPorId[c].nombre.toLowerCase()).join(' y ') +
        '. Los urgentes y los más antiguos aparecen primero.';
      await pintar({ resaltar: params.resaltar, conservarPagina: !!params.conservar });
    }
  };
}
