/* ==========================================================
   ReportaCampus · Servicio de reportes sobre la API
   Misma interfaz que src/services/reportes.service.js.
   La lista completa se guarda unos segundos para que el panel,
   las zonas y la lista no la pidan varias veces seguidas; cada
   cambio actualiza esa copia con lo que responde el servidor.
   ========================================================== */
import { CONFIG } from '../../config/config.js';
import { filtrarReportes } from '../../models/reporte.js';
import { revivirFechas } from '../almacenamiento.js';

export function crearReportesApi({ cliente }) {
  let copia = null;
  let copiaEn = 0;

  const ruta = (id, accion = '') => '/reportes/' + encodeURIComponent(id) + accion;

  async function todos() {
    if (copia && Date.now() - copiaEn < CONFIG.API_CACHE_MS) return copia;
    const res = await cliente.get('/reportes');
    if (!res.ok) throw new Error(res.error);
    copia = res.reportes.map(revivirFechas);
    copiaEn = Date.now();
    return copia;
  }

  /** Reemplaza (o agrega) el reporte en la copia local. */
  function actualizar(res) {
    if (!res.ok || !res.reporte) return res;
    const r = revivirFechas(res.reporte);
    if (copia) {
      const i = copia.findIndex((x) => x.id === r.id);
      if (i >= 0) copia[i] = r; else copia.unshift(r);
    }
    return { ...res, reporte: r, guardado: true };
  }

  const quitar = (id) => (res) => {
    if (res.ok && copia) copia = copia.filter((x) => x.id !== id);
    return { ...res, guardado: res.ok };
  };

  return {
    get ahora() { return new Date(); },

    async listar(filtros) { const lista = await todos(); return filtros ? filtrarReportes(lista, filtros) : lista.slice(); },
    async obtener(id) {
      const res = await cliente.get(ruta(id));
      return res.ok ? actualizar(res).reporte : null;
    },
    nombreResponsable(r) { return r.responsableNombre || 'Sin asignar'; },

    crear: async (datos) => actualizar(await cliente.post('/reportes', datos)),
    editar: async (id, datos) => actualizar(await cliente.put(ruta(id), datos)),
    eliminar: async (id) => quitar(id)(await cliente.del(ruta(id))),
    asignar: async (id, responsableId) => actualizar(await cliente.post(ruta(id, '/asignacion'), { responsableId })),
    tomar: async (id) => actualizar(await cliente.post(ruta(id, '/tomar'))),
    cambiarEstado: async (id, estado, nota) => actualizar(await cliente.post(ruta(id, '/estado'), { estado, nota })),
    cambiarPrioridad: async (id, prioridad) => actualizar(await cliente.patch(ruta(id, '/prioridad'), { prioridad })),
    comentar: async (id, nota) => actualizar(await cliente.post(ruta(id, '/notas'), { nota })),
    calificar: async (id, puntaje, comentario) => actualizar(await cliente.post(ruta(id, '/calificacion'), { puntaje, comentario })),

    async restablecer() {
      const res = await cliente.post('/datos/restablecer');
      copia = null;
      return res;
    },

    /** Olvida la copia local (por ejemplo, al cerrar sesión). */
    olvidar() { copia = null; }
  };
}
