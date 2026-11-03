/* ==========================================================
   ReportaCampus · Datos simulados
   ----------------------------------------------------------
   En esta primera fase no hay backend ni base de datos.
   Este archivo genera un conjunto de incidencias de prueba
   con un generador pseudoaleatorio con semilla, para que los
   datos sean siempre los mismos en cada carga de la página.
   ========================================================== */
(function () {
  'use strict';

  // Generador pseudoaleatorio determinista (mulberry32)
  function crearAleatorio(semilla) {
    let s = semilla >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = crearAleatorio(20262);
  const elegir = (lista) => lista[Math.floor(rnd() * lista.length)];
  const HORA = 3600 * 1000;
  const DIA = 24 * HORA;

  // ---------- Catálogos ----------
  const CATEGORIAS = [
    { id: 'infraestructura', nombre: 'Infraestructura', peso: 26 },
    { id: 'aseo',            nombre: 'Aseo',            peso: 22 },
    { id: 'tecnologia',      nombre: 'Tecnología',      peso: 18 },
    { id: 'seguridad',       nombre: 'Seguridad',       peso: 12 },
    { id: 'mobiliario',      nombre: 'Mobiliario',      peso: 13 },
    { id: 'servicios',       nombre: 'Servicios',       peso: 9 }
  ];

  const UBICACIONES = [
    { id: 'bloque-a',     nombre: 'Bloque A',      detalle: 'Aulas 101 – 412' },
    { id: 'bloque-b',     nombre: 'Bloque B',      detalle: 'Aulas y oficinas' },
    { id: 'biblioteca',   nombre: 'Biblioteca',    detalle: 'Salas de estudio' },
    { id: 'laboratorios', nombre: 'Laboratorios',  detalle: 'Cómputo e ingeniería' },
    { id: 'cafeteria',    nombre: 'Cafetería',     detalle: 'Plazoleta de comidas' },
    { id: 'auditorio',    nombre: 'Auditorio',     detalle: 'Auditorio principal' },
    { id: 'parqueadero',  nombre: 'Parqueadero',   detalle: 'Sótanos 1 y 2' },
    { id: 'zonas-verdes', nombre: 'Zonas verdes',  detalle: 'Plazoleta y jardines' }
  ];

  const TITULOS = {
    infraestructura: ['Gotera en el techo del salón', 'Puerta del baño no cierra', 'Baldosa suelta en el pasillo', 'Grieta en la pared del aula', 'Lámpara fundida en el corredor', 'Ventana rota en el segundo piso'],
    aseo:            ['Baño sin papel ni jabón', 'Canecas llenas en el pasillo', 'Derrame de líquido en la escalera', 'Salón sin aseo después de clase', 'Malos olores en el baño'],
    tecnologia:      ['Video beam no enciende', 'Sin conexión Wi-Fi en la sala', 'Computador no arranca', 'Toma eléctrica sin energía', 'Proyector con imagen borrosa', 'Impresora atascada'],
    seguridad:       ['Cámara de vigilancia apagada', 'Extintor vencido', 'Zona oscura sin iluminación', 'Torniquete de acceso fallando', 'Salida de emergencia obstruida'],
    mobiliario:      ['Silla con espaldar roto', 'Mesa inestable en la sala', 'Tablero en mal estado', 'Casillero sin cerradura'],
    servicios:       ['Bebedero sin agua', 'Fuga de agua en el lavamanos', 'Ascensor fuera de servicio', 'Aire acondicionado no funciona']
  };

  const RESPONSABLES = ['Mantenimiento – Carlos Ruiz', 'Servicios generales – Ana Torres', 'Soporte TI – Laura Gómez', 'Seguridad – Jorge Peña', 'Planta física – Diana Rojas'];
  const RESP_POR_CATEGORIA = {
    infraestructura: 'Planta física – Diana Rojas',
    aseo: 'Servicios generales – Ana Torres',
    tecnologia: 'Soporte TI – Laura Gómez',
    seguridad: 'Seguridad – Jorge Peña',
    mobiliario: 'Mantenimiento – Carlos Ruiz',
    servicios: 'Mantenimiento – Carlos Ruiz'
  };
  const NOMBRES = ['Valentina M.', 'Santiago R.', 'Camila P.', 'Andrés L.', 'Mariana G.', 'Daniel C.', 'Sofía H.', 'Juan D.', 'Laura V.', 'Mateo S.'];

  const RECOMENDACIONES = [
    { titulo: 'Indica el lugar exacto', texto: 'Escribe bloque, piso y número de salón. Así el equipo llega directo sin tener que buscar.' },
    { titulo: 'Adjunta una foto si puedes', texto: 'Ayuda a saber qué materiales llevar y qué tan urgente es antes de ir al sitio.' },
    { titulo: 'Revisa si ya lo reportaron', texto: 'Busca en la lista de reportes. Si ya existe, no hace falta crear otro.' },
    { titulo: 'Usa la prioridad alta solo para riesgos', texto: 'Cables expuestos, fugas de agua o zonas sin iluminación de noche.' },
    { titulo: 'Cierra llaves y apaga equipos', texto: 'Al salir del aula, apaga luces y proyector. Si ves una fuga, repórtala de inmediato.' },
    { titulo: 'Usa las canecas correctas', texto: 'Separar los residuos mantiene limpios los pasillos y reduce los reportes de aseo.' }
  ];

  const DETALLES = [
    'Se notó en la mañana, antes de la primera clase.',
    'Lleva varios días así y nadie lo ha revisado.',
    'Afecta a quienes usan el espacio en la jornada de la tarde.',
    'Ya se había reportado de palabra, pero sigue igual.',
    'Ocurrió después de la lluvia de ayer.',
    'Varias personas lo comentaron en el grupo del curso.'
  ];

  // Meta de atención: resolver en menos de 48 horas
  const META_HORAS = 48;

  // ---------- Generación de incidencias ----------
  function pesoAleatorio(lista) {
    const total = lista.reduce((s, x) => s + x.peso, 0);
    let r = rnd() * total;
    for (const item of lista) { r -= item.peso; if (r <= 0) return item; }
    return lista[lista.length - 1];
  }

  function generar(ahora) {
    const lista = [];
    const DIAS = 370; // un año: permite comparar con el periodo anterior

    for (let d = DIAS; d >= 0; d--) {
      const fechaDia = new Date(ahora.getTime() - d * DIA);
      const dow = fechaDia.getDay();
      // Menos reportes los fines de semana y algo más a mitad de semestre
      const base = (dow === 0) ? 0.4 : (dow === 6 ? 1.1 : 2.4);
      const ola = 1 + 0.35 * Math.sin((DIAS - d) / 22);
      const n = Math.round(base * ola + (rnd() - 0.4) * 2);

      for (let i = 0; i < Math.max(0, n); i++) {
        const cat = pesoAleatorio(CATEGORIAS);
        const ubic = elegir(UBICACIONES);
        const prioridad = rnd() < 0.2 ? 'Alta' : (rnd() < 0.6 ? 'Media' : 'Baja');
        const hora = 7 + Math.floor(rnd() * 13);
        const creado = new Date(fechaDia);
        creado.setHours(hora, Math.floor(rnd() * 60), 0, 0);
        if (creado > ahora) creado.setTime(ahora.getTime() - (1 + rnd() * 4) * HORA);

        // Tiempo de solución según prioridad (con mejora gradual en el semestre)
        const mejora = 1 - 0.25 * ((DIAS - d) / DIAS);
        const baseHoras = prioridad === 'Alta' ? 18 : prioridad === 'Media' ? 36 : 60;
        let horasSolucion = baseHoras * mejora * (0.35 + rnd() * 1.6);
        if (rnd() < 0.09) horasSolucion *= 2.5 + rnd() * 3; // casos que esperan repuestos o terceros
        const horasAsignacion = rnd() < 0.15 ? 12 + rnd() * 48 : 1 + rnd() * 10;

        const asignado = new Date(creado.getTime() + horasAsignacion * HORA);
        const resueltoEn = new Date(creado.getTime() + horasSolucion * HORA);
        const responsable = RESP_POR_CATEGORIA[cat.id];
        const autor = elegir(NOMBRES);

        const historial = [{ estado: 'Nuevo', fecha: creado, nota: 'Reporte registrado por la comunidad.', por: autor }];
        let estado = 'Nuevo';
        let resuelto = null;
        if (asignado <= ahora && asignado < resueltoEn) {
          estado = 'En proceso';
          historial.push({ estado, fecha: asignado, nota: 'Asignado a ' + responsable + '.', por: 'Administrador' });
        }
        if (resueltoEn <= ahora) {
          estado = 'Resuelto';
          resuelto = resueltoEn;
          historial.push({ estado, fecha: resueltoEn, nota: 'Se realizó la reparación y se verificó el espacio.', por: responsable });
        }

        const titulo = elegir(TITULOS[cat.id]);
        lista.push({
          id: '',
          titulo,
          descripcion: elegir(DETALLES),
          categoria: cat.id,
          ubicacion: ubic.id,
          prioridad,
          estado,
          creado,
          resuelto,
          responsable: estado === 'Nuevo' ? null : responsable,
          autor,
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

  const AHORA = new Date();

  window.RC_DATA = {
    ahora: AHORA,
    HORA,
    DIA,
    META_HORAS,
    META_CUMPLIMIENTO: 85,
    categorias: CATEGORIAS,
    ubicaciones: UBICACIONES,
    responsables: RESPONSABLES,
    recomendaciones: RECOMENDACIONES,
    incidencias: generar(AHORA),
    siguienteId: function () {
      const max = this.incidencias.reduce((m, x) => Math.max(m, parseInt(x.id.slice(3), 10)), 0);
      return 'RC-' + String(max + 1).padStart(4, '0');
    }
  };
})();
