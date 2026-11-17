<p align="center"><img src="public/img/logo.svg" alt="Logo de ReportaCampus" width="96"></p>

# ReportaCampus

**Producto publicado:** https://elone1415.github.io/ReportaCampus/ · **Versión:** 1.0.0 

ReportaCampus es una aplicación web para reportar las incidencias del campus (daños, fallas, problemas de aseo o de seguridad) y hacer seguimiento a su atención hasta que se resuelven. La comunidad reporta y califica la solución; los responsables de cada dependencia toman y resuelven los reportes de su área; el administrador reparte el trabajo, gestiona las cuentas y revisa la actividad.

Está formada por un **frontend** en HTML, CSS y JavaScript y un **backend** REST en Python con Flask, con base de datos **SQL Server** (o SQLite en desarrollo).

![Panel del administrador](documentacion/pruebas/evidencias/final/43-administrador-panel-final.png)

## Contenido

- [Información general](#información-general)
- [Funcionalidades](#funcionalidades)
- [Información técnica](#información-técnica)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Equipo](#equipo)
- [Estado final](#estado-final)
- [Documentación](#documentación)

## Información general

### Problemática

En el campus los daños y problemas se reportan de palabra, por correo o en grupos de chat. Los reportes se pierden o se repiten, nadie sabe quién los atiende y quien reporta no se entera de si se resolvió. Tampoco hay datos para saber cuánto tarda la atención ni qué zonas concentran más problemas.

### Justificación

Un canal único con estados, responsables e historial hace que cada reporte tenga dueño y trazabilidad, evita reportes duplicados (cualquiera puede buscar si ya existe) y da a la administración indicadores para decidir: tiempos de atención, zonas y categorías con más problemas, reportes que pasan de 48 horas y satisfacción con las soluciones. Una aplicación web funciona en el computador y en el celular sin instalar nada.

### Objetivos

**General.** Desarrollar una aplicación web que permita a la comunidad universitaria reportar incidencias del campus y consultar su estado, mientras los responsables las gestionan, con el fin de reducir el tiempo de respuesta, evitar reportes perdidos o repetidos y dar trazabilidad a cada caso.

**Específicos.**
1. Permitir registrar reportes con categoría, zona, prioridad y foto, y consultar su estado e historial.
2. Dar a cada rol (estudiante, responsable y administrador) solo las funciones que le corresponden, con autenticación y permisos revisados en el servidor.
3. Ofrecer un panel con indicadores, gráficas y metas de atención para el seguimiento.
4. Guardar la información en una base de datos a través de una API REST documentada.
5. Funcionar en computadores, tabletas y celulares, y validar todo con pruebas automáticas.

### Alcance

**Incluido:** registro y seguimiento de reportes con foto; roles de estudiante, responsable y administrador; asignación y toma de reportes; cambios de estado con historial; calificación de la solución; alertas de 48 horas; panel de indicadores; gestión de usuarios; registro de actividad; cambio de contraseña; API REST en Flask con base de datos SQL Server o SQLite.

**Fuera del alcance:** aplicación móvil nativa, notificaciones por correo, SMS o WhatsApp, integración con otros sistemas de la universidad, mapas o GPS y clasificación automática con inteligencia artificial.

## Funcionalidades

### Funcionalidades principales por rol

| Rol | Puede |
|---|---|
| **Estudiante** | Crear reportes con foto; ver *Mis reportes* por estado; editar o eliminar sus reportes mientras están en Nuevo; calificar de 1 a 5 la solución. |
| **Responsable** | Ver *Mis asignaciones* por urgencia, con alerta de los que pasan de 48 horas; tomar reportes nuevos de sus categorías; agregar notas y resolver con nota obligatoria; exportar a CSV. |
| **Administrador** | Asignar y reasignar responsables; cambiar prioridad, reabrir y eliminar reportes; gestionar usuarios; ver la actividad; restablecer los datos de demostración. |
| **Todos** | Panel, lista de reportes con búsqueda y filtros, zonas del campus, recomendaciones y *Mi cuenta* con cambio de contraseña. |

### Módulos desarrollados

| Módulo | Frontend | Backend |
|---|---|---|
| Autenticación y sesión | `pages/login.js`, `pages/cuenta.js`, `services/auth.service.js`, `services/api/auth.api.js` | `rutas/auth.py`, `seguridad.py` |
| Roles y permisos | `models/roles.js`, `config/rutas.js`, `router.js` | `permisos.py` |
| Reportes | `pages/` mis-reportes, asignados, reportes, nuevo; `components/` tabla, detalle, acciones | `rutas/reportes.py`, `servicios/reportes.py`, `servicios/fotos.py` |
| Usuarios | `pages/usuarios.js` | `rutas/usuarios.py`, `servicios/usuarios.py` |
| Panel e indicadores | `pages/panel.js`, `components/graficas.js` | `/api/reportes` |
| Actividad (auditoría) | `pages/actividad.js`, `services/auditoria.service.js` | `servicios/auditoria.py`, `/api/auditoria` |
| Manejo de errores | `components/estado-carga.js`, `components/toast.js`, `services/api/cliente.js` | errores JSON en `app/__init__.py` |

### Integraciones realizadas

- **Frontend ↔ API REST:** los servicios de `src/services/api/` llaman a 27 endpoints con `fetch`, token JWT, tiempo máximo de espera y manejo de errores. Tienen la misma interfaz que los servicios locales, así que las páginas son las mismas en los dos modos.
- **API ↔ base de datos:** SQLAlchemy con SQL Server (`mssql+pyodbc`) o SQLite; el esquema de SQL Server está en [`backend/sql/esquema-sqlserver.sql`](backend/sql/esquema-sqlserver.sql).
- **Fotos:** se reducen en el navegador y se validan y guardan en el servidor.
- **Chart.js:** gráficas interactivas del panel.

## Información técnica

### Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3 (variables, Grid, Flexbox, *media queries*), JavaScript con módulos ES, sin framework ni compilación. |
| Gráficas | Chart.js 4.6 (incluida en `public/vendor/`). |
| Backend | Python 3.11+, Flask 3.1, Flask-SQLAlchemy 3.1, SQLAlchemy 2.0, PyJWT 2.10, flask-cors 6, python-dotenv. |
| Base de datos | SQL Server (producción, con pyodbc y ODBC Driver 18) y SQLite (desarrollo y pruebas). |
| Seguridad | Contraseñas con PBKDF2-SHA256 (werkzeug) y tokens JWT. |
| Pruebas | `node:test`, pytest 8 y Playwright 1.65. |
| Herramientas | Visual Studio Code, Git, GitHub y GitHub Pages. |

### Arquitectura

```mermaid
flowchart LR
    subgraph Navegador
        P["Páginas y componentes"] --> S["Servicios<br/>(misma interfaz)"]
        S -->|modo navegador| L[("localStorage")]
        S -->|modo servidor| C["Cliente HTTP"]
    end
    C -- "JSON + token JWT" --> R["API REST Flask<br/>rutas · permisos · servicios"]
    R --> O["SQLAlchemy"] --> D[("SQL Server / SQLite")]
    R --> F[("Fotos")]
```

Las páginas usan componentes y servicios. Los servicios tienen dos implementaciones con la misma interfaz: una guarda en el navegador y la otra llama a la API. Si la página la entrega el backend, se usa la API; en GitHub Pages, el navegador. El backend revisa la sesión y los permisos en cada petición con la misma matriz del frontend, aplica las reglas y guarda en la base de datos.

Detalle de componentes, flujo de información, manejo de errores y despliegue: [documentacion/arquitectura](documentacion/arquitectura/arquitectura.md).

### Estructura del proyecto

```
ReportaCampus/
├── index.html · package.json · playwright.config.js · LICENSE · .gitignore · .editorconfig
├── public/                 Logo, tipografía y Chart.js
├── src/
│   ├── main.js · router.js
│   ├── config/             Configuración y rutas por rol
│   ├── models/             Reglas, validaciones y permisos
│   ├── data/               Datos de demostración
│   ├── services/           Servicios locales · api/ (cliente y servicios sobre la API)
│   ├── components/         Piezas reutilizables
│   ├── pages/              Una por sección
│   ├── utils/              Utilidades
│   └── styles/             base · layout · components · pages · responsive
├── backend/
│   ├── run.py · requirements*.txt · .env.example · pytest.ini
│   ├── app/                Flask: rutas/, servicios/, modelos, seguridad, permisos, validación
│   ├── datos/              semilla.json (datos de demostración)
│   ├── sql/                esquema-sqlserver.sql
│   └── tests/              pytest
├── scripts/                Servidor estático y exportación de la semilla
├── tests/                  Unitarias (node:test) · e2e/ (Playwright)
└── documentacion/          Manuales, arquitectura, diagramas, requerimientos, pruebas y decisiones
```

### Dependencias

| Dónde | Dependencias (versiones fijadas) |
|---|---|
| `backend/requirements.txt` | Flask 3.1.3, Flask-SQLAlchemy 3.1.1, SQLAlchemy 2.0.44, PyJWT 2.10.1, flask-cors 6.0.1, python-dotenv 1.2.1 |
| `backend/requirements-sqlserver.txt` | pyodbc 5.3.0 |
| `backend/requirements-dev.txt` | pytest 8.4.2 |
| `package.json` (desarrollo) | @playwright/test 1.65.1 |
| Incluidas en el repositorio | Chart.js 4.6 (MIT) y la tipografía Lato (OFL) |

El frontend no necesita instalar nada para funcionar.

### Requisitos

- Navegador actualizado (Chrome, Edge, Firefox o Safari).
- Para el backend: Python 3.11 o superior. Para SQL Server: el ODBC Driver 18.
- Para las pruebas: Node.js 20 o superior.

### Instalación

```bash
git clone https://github.com/ElOne1415/ReportaCampus.git
cd ReportaCampus/backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Windows: copy .env.example .env
```

Edita `.env` y cambia `SECRET_KEY` por una clave propia:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Configuración

| Archivo | Valores principales |
|---|---|
| `backend/.env` | `SECRET_KEY`, `DATABASE_URL` (SQLite por defecto o SQL Server), `JWT_HORAS`, `CORS_ORIGENES`, `MOSTRAR_CUENTAS_DEMO`, `CONTRASENA_INICIAL`. |
| `src/config/config.js` | `FUENTE_DATOS` (`auto`, `api` o `local`), `API_URL`, metas de atención. |
| `src/config/rutas.js` | Rutas, permisos y página de inicio de cada rol. |

Para conectar **SQL Server**:

```bash
pip install -r requirements-sqlserver.txt
# en .env:
DATABASE_URL=mssql+pyodbc://USUARIO:CONTRASENA@SERVIDOR:1433/ReportaCampus?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
```

Tabla completa de variables: [manual técnico](documentacion/manual_tecnico/manual-tecnico.md#4-configuración).

### Ejecución

| Modo | Comando | Dirección |
|---|---|---|
| **Completo** (frontend + API + base de datos) | `cd backend && python run.py` | <http://localhost:5000> |
| Solo frontend (datos en el navegador) | `npm start` | <http://localhost:8080> |
| Volver a los datos iniciales | `cd backend && flask --app run semilla` | — |

La primera vez, el backend crea la base de datos con los datos de demostración. El pie de página indica de dónde vienen los datos.

#### Cuentas de demostración

Todas usan la contraseña **`campus2026`**. La página de inicio de sesión tiene un botón para entrar con cada una.

| Rol | Nombre | Correo |
|---|---|---|
| Estudiante | Valentina Martínez | `valentina.martinez@campus.edu.co` |
| Responsable | Diana Rojas (Planta física) | `diana.rojas@campus.edu.co` |
| Administrador | Paola Méndez | `admin@campus.edu.co` |

Hay 16 cuentas en total. `mateo.sanchez@campus.edu.co` está desactivada a propósito.

## Pruebas

### Estrategia

Cuatro niveles: **unitarias** del frontend (modelos, permisos, servicios, cliente de la API), **backend** (cada endpoint con su base de datos de prueba), **de extremo a extremo** en Chrome (cada caso en modo navegador y con el backend, lo que prueba la integración frontend–API–base de datos) y revisión **manual** en distintos tamaños de pantalla.

### Pruebas realizadas y resultados

| Batería | Comando | Resultado |
|---|---|---|
| Unitarias del frontend | `npm test` | **57 de 57** |
| Backend | `cd backend && pytest` | **33 de 33** |
| De extremo a extremo | `npm run test:e2e` | **33 de 33** |

Las pruebas cubren navegación, formularios, validaciones, funcionalidades de los tres roles, integración entre componentes, acceso a datos, tamaños de pantalla de 360 a 1366 px y manejo de errores (sin conexión, error 500, sesión vencida). Encontraron cinco problemas, ya corregidos; entre ellos, una ruta que exponía archivos del backend y un desbordamiento de *Mi cuenta* en celular.

Plan, casos, resultados completos y evidencias: [documentacion/pruebas](documentacion/pruebas/plan-de-pruebas.md).

| Estudiante: calificar | Responsable: alerta y disponibles |
|---|---|
| ![Calificar](documentacion/pruebas/evidencias/final/39-estudiante-calificar.png) | ![Asignaciones](documentacion/pruebas/evidencias/final/41-responsable-alerta-y-disponibles.png) |

| Administrador: actividad | Error de conexión | Celular |
|---|---|---|
| ![Actividad](documentacion/pruebas/evidencias/final/44-administrador-actividad.png) | ![Error](documentacion/pruebas/evidencias/final/46-error-sin-conexion.png) | ![Celular](documentacion/pruebas/evidencias/final/47-movil-asignaciones-final.png) |

## Despliegue

| | |
|---|---|
| **Dirección** | https://elone1415.github.io/ReportaCampus/ |
| **Plataforma** | GitHub Pages, desde la rama `main` |
| **Acceso** | Abre la dirección y entra con una de las [cuentas de demostración](#cuentas-de-demostración). |

En GitHub Pages no hay backend, así que la aplicación publicada funciona en **modo navegador**: tiene todas las funciones, pero los datos de demostración se guardan en el navegador de cada persona.

La versión completa, con la API y la base de datos, se ejecuta en local con `python run.py` ([ejecución](#ejecución)). El backend está preparado para publicarse con `gunicorn` en un servicio como Render o Azure App Service; los pasos están en el [manual técnico](documentacion/manual_tecnico/manual-tecnico.md#10-despliegue).

## Equipo

| Integrante | Roles y responsabilidades |
|---|---|
| Juan Diego Fajardo Suárez | *(por completar)* |
| Juan Camilo Céspedes | *(por completar)* |
| Sebastián Pérez | *(por completar)* |

## Estado final

### Funcionalidades terminadas

Todo el alcance definido está implementado y probado: los 26 requerimientos funcionales de [requerimientos](documentacion/requerimientos/requerimientos.md), los tres roles con sus permisos, la API REST con 27 endpoints, la base de datos, la autenticación con contraseñas cifradas y tokens, las fotos en el servidor, la calificación de soluciones, la toma de reportes, las alertas de 48 horas, el registro de actividad y el cambio de contraseña.

### Limitaciones conocidas

- El backend no está publicado en internet; la versión de GitHub Pages usa datos de demostración en el navegador.
- La conexión con un SQL Server real no se probó dentro del proyecto: el código y las pruebas usan SQLite, y el esquema de SQL Server se genera y se valida desde los mismos modelos.
- En modo navegador no hay seguridad real: los datos y la sesión se pueden modificar desde las herramientas del navegador. Es solo para la demostración.
- Las cuentas de demostración comparten una contraseña pública (`campus2026`).
- Sin migraciones de base de datos: un cambio en los modelos requiere volver a crear la base.
- Las fotos se guardan en el disco del servidor; en servicios sin disco persistente se pierden al reiniciar.

### Mejoras futuras

- Publicar el backend con SQL Server o Azure SQL y almacenamiento de fotos en la nube.
- Notificaciones por correo cuando cambia el estado de un reporte.
- Migraciones de base de datos con Alembic.
- Recuperación de contraseña por correo y límite de intentos de inicio de sesión.
- Reportes en PDF y estadísticas por zona y por responsable.
- Revisión de accesibilidad con herramientas automáticas y pruebas en más navegadores.

## Documentación

| Documento | Contenido |
|---|---|
| [Manual de usuario](documentacion/manual_usuario/manual-usuario.md) | Cómo usar la aplicación según el rol. |
| [Manual técnico](documentacion/manual_tecnico/manual-tecnico.md) | Instalación, configuración, API, base de datos, seguridad, pruebas, despliegue y mantenimiento. |
| [Arquitectura](documentacion/arquitectura/arquitectura.md) | Componentes, flujo de información y despliegue. |
| [Diagramas](documentacion/diagramas/) | Casos de uso, estados, modelo de datos y navegación. |
| [Requerimientos](documentacion/requerimientos/requerimientos.md) | Funcionales, no funcionales, permisos e historias de usuario. |
| [Pruebas](documentacion/pruebas/plan-de-pruebas.md) | Estrategia, resultados y evidencias. |
| [Decisiones técnicas](documentacion/decisiones_tecnicas/README.md) | Nueve ADR. |

## Colorimetría

La paleta combina un rojo como color principal de la marca con un gris pizarra para textos y navegación, sobre fondos neutros. Los colores están definidos como variables al inicio de `src/styles/base.css`.

El logo (`public/img/logo.svg`) es un marcador de ubicación con una marca de verificación: une la idea de reportar un lugar con la de un caso resuelto.

| Muestra | Nombre | Hex | Uso |
|---|---|---|---|
| ![Rojo oscuro](documentacion/diseno/colores/rojo-oscuro.svg) | Rojo oscuro | `#A60311` | Barra superior, enlace activo del menú, mensajes de error. |
| ![Rojo](documentacion/diseno/colores/rojo.svg) | Rojo | `#C1272D` | Botón principal, reportes recibidos en la gráfica, estado Nuevo. |
| ![Gris pizarra](documentacion/diseno/colores/pizarra.svg) | Gris pizarra | `#333C4E` | Títulos, menú, periodo seleccionado. |
| ![Azul](documentacion/diseno/colores/azul.svg) | Azul | `#3B64A0` | Reportes resueltos en la gráfica, enlaces y foco del teclado. |
| ![En proceso](documentacion/diseno/colores/proceso.svg) | Ámbar | `#B0700F` | Estado En proceso y metas no cumplidas. |
| ![Resuelto](documentacion/diseno/colores/resuelto.svg) | Verde | `#2F7D4F` | Estado Resuelto y metas cumplidas. |
| ![Tinta](documentacion/diseno/colores/tinta.svg) | Tinta | `#2B2B2B` | Texto principal. |
| ![Gris](documentacion/diseno/colores/gris.svg) | Gris | `#6F777F` | Textos secundarios y etiquetas. |
| ![Línea](documentacion/diseno/colores/linea.svg) | Línea | `#E1DDD9` | Bordes y separadores. |
| ![Fondo](documentacion/diseno/colores/fondo.svg) | Fondo | `#F2F1F0` | Fondo general. |
| ![Blanco](documentacion/diseno/colores/blanco.svg) | Blanco | `#FFFFFF` | Paneles, tablas y formularios. |

Los estados siempre se muestran con su nombre junto al color, para que no dependan solo de él. Cada rol tiene además una etiqueta de color en la barra superior: azul para estudiante, ámbar para responsable y rojo para administrador.

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v0.1 | 3 de noviembre de 2026 | Fase I: estructura del repositorio, página principal, diseño adaptable, datos simulados, gráficas, filtros, formulario, detalle y navegación. |
| v0.2 | 10 de noviembre de 2026 | Reportes guardados en el navegador, vista previa de la foto y exportación a CSV. |
| v0.3 | 17 de noviembre de 2026 | Fase II: inicio de sesión con roles, mis reportes, mis asignaciones, gestión de reportes y usuarios, arquitectura por capas, rutas, pruebas unitarias y documentación técnica. |
| v1.0 | 17 de noviembre de 2026 | Entrega final: backend Flask con API REST y base de datos SQL Server/SQLite, autenticación con contraseñas cifradas y JWT, fotos en el servidor, calificación de soluciones, tomar reportes, alertas de 48 horas, registro de actividad, Mi cuenta, manejo de errores, pruebas de backend y de extremo a extremo, manuales de usuario y técnico. |

## Licencia

[MIT](LICENSE) © 2026 Juan Diego Fajardo Suárez, Juan Camilo Céspedes y Sebastián Pérez.
