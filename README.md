# ReportaCampus

Prototipo web para reportar incidencias del campus (daños, fallas, problemas de aseo o de seguridad) y consultar en qué estado está cada una.

**Versión:** 0.1, primera entrega. Es un prototipo de interfaz: no tiene backend ni base de datos todavía y trabaja con datos de prueba.

![Panel de incidencias](docs/evidencias/01-escritorio-panel.png)

## Objetivo

Que la comunidad del campus pueda informar lo que está dañado o mal y ver cómo avanza su atención, para:

- reducir el tiempo de respuesta,
- evitar reportes perdidos o repetidos,
- dejar trazabilidad de cada caso.

## Qué incluye esta entrega

- **Panel de incidencias** con cuatro indicadores: reportes recibidos, reportes sin resolver, tiempo promedio de solución y porcentaje resuelto en menos de 48 horas.
- **Gráfica interactiva** (Chart.js) de reportes recibidos y resueltos, con selector de periodo *Semana / Mes / Semestre*, detalle al pasar el cursor y opción de verla como tabla.
- **Gráfica por categoría**: al hacer clic en una barra se filtra la lista de reportes.
- **Metas de atención del semestre** con su avance.
- **Lista de reportes** con búsqueda y filtros por estado, categoría y zona. Cada reporte abre su detalle con el historial de estados.
- **Zonas del campus**: reportes abiertos por espacio (bloques, biblioteca, laboratorios, etc.).
- **Formulario de nuevo reporte** con validación de campos obligatorios.
- **Recomendaciones** para reportar mejor y cuidar los espacios.
- **Diseño adaptable** a computador, tableta y celular (menú lateral desplegable y tabla en filas apiladas).

## Qué queda para las siguientes entregas

- Backend en Python con Flask y API para incidencias y usuarios.
- Base de datos en SQL Server.
- Inicio de sesión con roles (estudiante, responsable, administrador).
- Asignación de responsables y cambio de estado desde un panel administrativo.
- Carga real de fotos.

Fuera del alcance del proyecto: app móvil nativa, notificaciones por correo/SMS/WhatsApp, integración con otros sistemas, mapas o GPS y clasificación automática con IA.

## Datos de prueba

`js/data.js` genera un año de incidencias simuladas con un generador pseudoaleatorio con semilla, así que los datos son los mismos en cada carga. Los reportes nuevos se guardan solo en memoria y se pierden al recargar la página.

## Tecnologías

- HTML5
- CSS3 (Grid, Flexbox y media queries)
- JavaScript sin frameworks
- [Chart.js 4.6](https://www.chartjs.org/), incluido en `js/vendor/`
- Tipografía Lato (licencia OFL), incluida en `assets/fonts/`
- Git y GitHub
- Visual Studio Code

## Estructura

```
ReportaCampus/
├── index.html            Página principal
├── css/
│   └── styles.css        Estilos y diseño adaptable
├── js/
│   ├── data.js           Datos de prueba
│   ├── charts.js         Gráficas
│   ├── app.js            Lógica de la interfaz
│   └── vendor/           Chart.js
├── assets/
│   └── fonts/            Tipografía
└── docs/
    └── evidencias/       Capturas del prototipo
```

## Cómo ejecutarlo

No requiere instalar nada ni conexión a internet.

1. Clona el repositorio:
   ```bash
   git clone https://github.com/ElOne1415/ReportaCampus.git
   ```
2. Abre `index.html` en un navegador actualizado (Chrome, Edge, Firefox o Safari).

También se puede servir en local con la extensión **Live Server** de VS Code o con:

```bash
python3 -m http.server 8000
```

y abrir <http://localhost:8000>.

Para revisar la vista de celular: herramientas de desarrollo del navegador (`F12` o `Cmd + Option + I`) y modo dispositivo.

## Pruebas realizadas

| Prueba | Resultado |
|---|---|
| La página carga sin errores en la consola | Correcto |
| Cambiar el periodo actualiza indicadores y gráficas | Correcto |
| Detalle al pasar el cursor y vista en tabla de la gráfica | Correcto |
| Clic en una categoría filtra la lista | Correcto |
| Búsqueda y filtros de la lista | Correcto |
| El formulario marca los campos obligatorios vacíos | Correcto |
| Un reporte nuevo aparece primero en la lista y suma en los indicadores | Correcto |
| Detalle con historial de estados | Correcto |
| Menú lateral en escritorio y menú desplegable en celular | Correcto |
| Sin desplazamiento horizontal a 390 px, 820 px y 1366 px | Correcto |

## Evidencias

| Escritorio | Celular |
|---|---|
| ![Panel en escritorio](docs/evidencias/01-escritorio-panel.png) | ![Panel en celular](docs/evidencias/09-movil-panel.png) |

Gráfica con periodo *Semestre* y detalle al pasar el cursor:

![Gráfica interactiva](docs/evidencias/03-grafica-semestre.png)

Todas las capturas están en [`docs/evidencias/`](docs/evidencias/):

| Archivo | Qué muestra |
|---|---|
| `01-escritorio-panel.png` | Panel en escritorio |
| `02-escritorio-pagina-completa.png` | Página completa |
| `03-grafica-semestre.png` | Gráfica por semestre con detalle |
| `04-grafica-semana-tabla.png` | Gráfica por semana con vista en tabla |
| `05-filtro-categoria.png` | Lista filtrada desde la gráfica de categorías |
| `06-formulario-validacion.png` | Validación del formulario |
| `07-reporte-enviado.png` | Reporte nuevo en la lista |
| `08-detalle-historial.png` | Detalle e historial de un reporte |
| `09-movil-panel.png` | Panel en celular |
| `10-movil-menu.png` | Menú en celular |
| `11-movil-reportes.png` | Lista de reportes en celular |
| `12-tableta-panel.png` | Panel en tableta |
