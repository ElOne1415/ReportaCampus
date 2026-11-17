/* ==========================================================
   ReportaCampus · Catálogos
   Categorías, zonas, estados y prioridades de un reporte.
   ========================================================== */

export const CATEGORIAS = Object.freeze([
  { id: 'infraestructura', nombre: 'Infraestructura', peso: 26 },
  { id: 'aseo',            nombre: 'Aseo',            peso: 22 },
  { id: 'tecnologia',      nombre: 'Tecnología',      peso: 18 },
  { id: 'seguridad',       nombre: 'Seguridad',       peso: 12 },
  { id: 'mobiliario',      nombre: 'Mobiliario',      peso: 13 },
  { id: 'servicios',       nombre: 'Servicios',       peso: 9 }
]);

export const ZONAS = Object.freeze([
  { id: 'bloque-a',     nombre: 'Bloque A',     detalle: 'Aulas 101 – 412' },
  { id: 'bloque-b',     nombre: 'Bloque B',     detalle: 'Aulas y oficinas' },
  { id: 'biblioteca',   nombre: 'Biblioteca',   detalle: 'Salas de estudio' },
  { id: 'laboratorios', nombre: 'Laboratorios', detalle: 'Cómputo e ingeniería' },
  { id: 'cafeteria',    nombre: 'Cafetería',    detalle: 'Plazoleta de comidas' },
  { id: 'auditorio',    nombre: 'Auditorio',    detalle: 'Auditorio principal' },
  { id: 'parqueadero',  nombre: 'Parqueadero',  detalle: 'Sótanos 1 y 2' },
  { id: 'zonas-verdes', nombre: 'Zonas verdes', detalle: 'Plazoleta y jardines' }
]);

export const ESTADOS = Object.freeze({ NUEVO: 'Nuevo', EN_PROCESO: 'En proceso', RESUELTO: 'Resuelto' });
export const LISTA_ESTADOS = Object.freeze([ESTADOS.NUEVO, ESTADOS.EN_PROCESO, ESTADOS.RESUELTO]);
export const PRIORIDADES = Object.freeze(['Baja', 'Media', 'Alta']);

/** Clase CSS de cada estado */
export const CLASE_ESTADO = Object.freeze({ 'Nuevo': 'nuevo', 'En proceso': 'proceso', 'Resuelto': 'resuelto' });

export const RECOMENDACIONES = Object.freeze([
  { titulo: 'Indica el lugar exacto', texto: 'Escribe bloque, piso y número de salón. Así el equipo llega directo sin tener que buscar.' },
  { titulo: 'Adjunta una foto si puedes', texto: 'Ayuda a saber qué materiales llevar y qué tan urgente es antes de ir al sitio.' },
  { titulo: 'Revisa si ya lo reportaron', texto: 'Busca en la lista de reportes. Si ya existe, no hace falta crear otro.' },
  { titulo: 'Usa la prioridad alta solo para riesgos', texto: 'Cables expuestos, fugas de agua o zonas sin iluminación de noche.' },
  { titulo: 'Cierra llaves y apaga equipos', texto: 'Al salir del aula, apaga luces y proyector. Si ves una fuga, repórtala de inmediato.' },
  { titulo: 'Usa las canecas correctas', texto: 'Separar los residuos mantiene limpios los pasillos y reduce los reportes de aseo.' }
]);

export const categoriaPorId = Object.freeze(Object.fromEntries(CATEGORIAS.map((c) => [c.id, c])));
export const zonaPorId = Object.freeze(Object.fromEntries(ZONAS.map((z) => [z.id, z])));
