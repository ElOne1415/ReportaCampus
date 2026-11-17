/* ==========================================================
   ReportaCampus · Datos simulados
   ----------------------------------------------------------
   Genera un año de reportes de prueba con un generador
   pseudoaleatorio con semilla, para que el contenido sea el
   mismo en cada carga. Se reemplaza por la base de datos en
   la entrega final.
   ========================================================== */
import { CATEGORIAS, ZONAS, ESTADOS } from '../models/catalogos.js';
import { HORA, DIA } from '../utils/tiempo.js';
import { USUARIOS_DEMO, RESPONSABLE_POR_CATEGORIA, AUTORES_DEMO } from './usuarios.js';

/** Generador pseudoaleatorio determinista (mulberry32). */
export function crearAleatorio(semilla) {
  let s = semilla >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TITULOS = {
  infraestructura: ['Gotera en el techo del salón', 'Puerta del baño no cierra', 'Baldosa suelta en el pasillo', 'Grieta en la pared del aula', 'Lámpara fundida en el corredor', 'Ventana rota en el segundo piso'],
  aseo:            ['Baño sin papel ni jabón', 'Canecas llenas en el pasillo', 'Derrame de líquido en la escalera', 'Salón sin aseo después de clase', 'Malos olores en el baño'],
  tecnologia:      ['Video beam no enciende', 'Sin conexión Wi-Fi en la sala', 'Computador no arranca', 'Toma eléctrica sin energía', 'Proyector con imagen borrosa', 'Impresora atascada'],
  seguridad:       ['Cámara de vigilancia apagada', 'Extintor vencido', 'Zona oscura sin iluminación', 'Torniquete de acceso fallando', 'Salida de emergencia obstruida'],
  mobiliario:      ['Silla con espaldar roto', 'Mesa inestable en la sala', 'Tablero en mal estado', 'Casillero sin cerradura'],
  servicios:       ['Bebedero sin agua', 'Fuga de agua en el lavamanos', 'Ascensor fuera de servicio', 'Aire acondicionado no funciona']
};

const DETALLES = [
  'Se notó en la mañana, antes de la primera clase.',
  'Lleva varios días así y nadie lo ha revisado.',
  'Afecta a quienes usan el espacio en la jornada de la tarde.',
  'Ya se había reportado de palabra, pero sigue igual.',
  'Ocurrió después de la lluvia de ayer.',
  'Varias personas lo comentaron en el grupo del curso.'
];

const usuarioPorId = Object.fromEntries(USUARIOS_DEMO.map((u) => [u.id, u]));
const conArea = (u) => u.area + ' – ' + u.nombre;

/**
 * Genera los reportes simulados hasta la fecha `ahora`.
 * Devuelve la lista con los más recientes primero.
 */
export function generarReportes(ahora, semilla, dias) {
  const rnd = crearAleatorio(semilla);
  const elegir = (lista) => lista[Math.floor(rnd() * lista.length)];
  const pesoAleatorio = (lista) => {
    const total = lista.reduce((s, x) => s + x.peso, 0);
    let r = rnd() * total;
    for (const item of lista) { r -= item.peso; if (r <= 0) return item; }
    return lista[lista.length - 1];
  };

  const lista = [];
  for (let d = dias; d >= 0; d--) {
    const fechaDia = new Date(ahora.getTime() - d * DIA);
    const dow = fechaDia.getDay();
    // Menos reportes los fines de semana y algo más a mitad de semestre
    const base = (dow === 0) ? 0.4 : (dow === 6 ? 1.1 : 2.4);
    const ola = 1 + 0.35 * Math.sin((dias - d) / 22);
    const n = Math.round(base * ola + (rnd() - 0.4) * 2);

    for (let i = 0; i < Math.max(0, n); i++) {
      const cat = pesoAleatorio(CATEGORIAS);
      const ubic = elegir(ZONAS);
      const prioridad = rnd() < 0.2 ? 'Alta' : (rnd() < 0.6 ? 'Media' : 'Baja');
      const hora = 7 + Math.floor(rnd() * 13);
      const creado = new Date(fechaDia);
      creado.setHours(hora, Math.floor(rnd() * 60), 0, 0);
      if (creado > ahora) creado.setTime(ahora.getTime() - (1 + rnd() * 4) * HORA);

      // Tiempo de solución según prioridad (con mejora gradual en el semestre)
      const mejora = 1 - 0.25 * ((dias - d) / dias);
      const baseHoras = prioridad === 'Alta' ? 18 : prioridad === 'Media' ? 36 : 60;
      let horasSolucion = baseHoras * mejora * (0.35 + rnd() * 1.6);
      if (rnd() < 0.09) horasSolucion *= 2.5 + rnd() * 3; // casos que esperan repuestos o terceros
      const horasAsignacion = rnd() < 0.15 ? 12 + rnd() * 48 : 1 + rnd() * 10;

      const asignado = new Date(creado.getTime() + horasAsignacion * HORA);
      const resueltoEn = new Date(creado.getTime() + horasSolucion * HORA);
      const responsable = usuarioPorId[RESPONSABLE_POR_CATEGORIA[cat.id]];
      const autor = usuarioPorId[elegir(AUTORES_DEMO)];

      const historial = [{ estado: ESTADOS.NUEVO, fecha: creado, nota: 'Reporte registrado por la comunidad.', por: autor.nombre }];
      let estado = ESTADOS.NUEVO;
      let resuelto = null;
      if (asignado <= ahora && asignado < resueltoEn) {
        estado = ESTADOS.EN_PROCESO;
        historial.push({ estado, fecha: asignado, nota: 'Asignado a ' + conArea(responsable) + '.', por: usuarioPorId['u-001'].nombre });
      }
      if (resueltoEn <= ahora) {
        estado = ESTADOS.RESUELTO;
        resuelto = resueltoEn;
        historial.push({ estado, fecha: resueltoEn, nota: 'Se realizó la reparación y se verificó el espacio.', por: responsable.nombre });
      }

      lista.push({
        id: '',
        titulo: elegir(TITULOS[cat.id]),
        descripcion: elegir(DETALLES),
        categoria: cat.id,
        ubicacion: ubic.id,
        prioridad,
        estado,
        creado,
        resuelto,
        responsableId: estado === ESTADOS.NUEVO ? null : responsable.id,
        autorId: autor.id,
        autor: autor.nombre,
        foto: rnd() < 0.45,
        historial
      });
    }
  }
  // Códigos consecutivos en orden cronológico; más recientes primero
  lista.sort((a, b) => a.creado - b.creado);
  lista.forEach((x, i) => { x.id = 'RC-' + String(i + 1).padStart(4, '0'); });
  return lista.reverse();
}
