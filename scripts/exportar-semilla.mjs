/* ==========================================================
   Exporta los datos de demostración del frontend a
   backend/datos/semilla.json para que el backend cargue
   exactamente los mismos reportes, usuarios y catálogos.

   Las fechas se guardan como horas antes de la exportación; el
   backend las corre por días completos hasta la fecha de carga,
   así la semilla nunca queda desactualizada y conserva la hora
   del día de cada reporte.

   Uso:  node scripts/exportar-semilla.mjs
   ========================================================== */
import { writeFileSync } from 'node:fs';
import { CONFIG } from '../src/config/config.js';
import { CATEGORIAS, ZONAS } from '../src/models/catalogos.js';
import { generarReportes } from '../src/data/semilla.js';
import { USUARIOS_DEMO } from '../src/data/usuarios.js';

const ahora = new Date();
const horas = (f) => (f ? Math.round((ahora - f) / 36e5 * 100) / 100 : null);
const numero = (id) => parseInt(id.replace(/\D/g, ''), 10);

const reportes = generarReportes(ahora, CONFIG.SEMILLA, CONFIG.DIAS_SIMULADOS).reverse().map((r) => ({
  id: numero(r.id),
  titulo: r.titulo,
  descripcion: r.descripcion,
  categoria: r.categoria,
  zona: r.ubicacion,
  prioridad: r.prioridad,
  estado: r.estado,
  autor: r.autorId ? numero(r.autorId) : null,
  autorNombre: r.autor,
  responsable: r.responsableId ? numero(r.responsableId) : null,
  fotoSimulada: !!r.foto,
  calificacion: r.calificacion || null,
  creadoHace: horas(r.creado),
  resueltoHace: horas(r.resuelto),
  historial: r.historial.map((h) => ({ estado: h.estado, nota: h.nota, por: h.por, hace: horas(h.fecha) }))
}));

const salida = {
  descripcion: 'Datos de demostración de ReportaCampus. Generado con scripts/exportar-semilla.mjs; no editar a mano.',
  exportadoEn: ahora.toISOString(),
  contrasenaDemo: CONFIG.CONTRASENA_DEMO,
  categorias: CATEGORIAS.map((c) => ({ id: c.id, nombre: c.nombre })),
  zonas: ZONAS.map((z) => ({ id: z.id, nombre: z.nombre, detalle: z.detalle })),
  usuarios: USUARIOS_DEMO.map((u) => ({ id: numero(u.id), nombre: u.nombre, correo: u.correo, rol: u.rol, area: u.area, categorias: u.categorias, activo: u.activo !== false })),
  reportes
};

writeFileSync(new URL('../backend/datos/semilla.json', import.meta.url), JSON.stringify(salida) + '\n');
console.log('semilla.json: ' + reportes.length + ' reportes, ' + salida.usuarios.length + ' usuarios');
