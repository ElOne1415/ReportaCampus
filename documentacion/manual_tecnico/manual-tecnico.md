# Manual técnico de ReportaCampus

Versión 1.0.0. Este manual es para quien va a instalar, configurar, ejecutar, probar, desplegar o modificar la aplicación. El [manual de usuario](../manual_usuario/manual-usuario.md) explica cómo se usa.

## 1. Componentes

| Componente | Tecnología | Carpeta |
|---|---|---|
| Frontend | HTML5, CSS3 y JavaScript con módulos ES, sin compilación. Chart.js 4.6 para las gráficas. | `index.html`, `src/`, `public/` |
| Backend (API REST) | Python 3.11 o superior, Flask 3.1, SQLAlchemy 2.0, PyJWT. | `backend/app/` |
| Base de datos | SQLite en desarrollo y pruebas; SQL Server en producción (mismo código, con `pyodbc`). | `backend/sql/`, `backend/datos/` |
| Pruebas | `node:test` (frontend), pytest (backend), Playwright (de extremo a extremo). | `tests/`, `backend/tests/`, `tests/e2e/` |

El frontend funciona de dos formas (ver [ADR-007](../decisiones_tecnicas/ADR-007-fuente-de-datos-automatica.md)):

- **Con servidor:** Flask entrega la página y la API en la misma dirección. Los datos se guardan en la base de datos y los comparten todos los usuarios.
- **Solo navegador:** si la página se abre sin el backend (GitHub Pages o `npm start`), los datos de demostración se guardan en el navegador de cada persona.

## 2. Requisitos

| Para | Necesitas |
|---|---|
| Usar la versión publicada | Un navegador actualizado (Chrome, Edge, Firefox o Safari). |
| Ejecutar con backend | Python 3.11 o superior y `pip`. |
| Ejecutar solo el frontend | Node.js 20 o superior, Python 3, o la extensión Live Server de VS Code. |
| Conectar SQL Server | SQL Server 2019 o superior (o Azure SQL) y el [ODBC Driver 18 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server). |
| Correr las pruebas | Node.js 20 o superior (unitarias), Python con las dependencias de desarrollo (pytest) y Playwright (de extremo a extremo). |

## 3. Instalación y ejecución

### 3.1 Con backend (recomendado)

```bash
git clone https://github.com/ElOne1415/ReportaCampus.git
cd ReportaCampus/backend

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # Windows: copy .env.example .env
# Edita .env y pon una SECRET_KEY propia (ver sección 4)

python run.py
```

Abre <http://localhost:5000>. La primera vez se crea `backend/instancia/reportacampus.db` con los datos de demostración (unos segundos). El pie de página dice **Datos del servidor (SQLite)**.

Para volver a los datos iniciales:

```bash
flask --app run semilla
```

o, desde la aplicación, entra como administrador → *Usuarios* → *Restablecer datos*.

### 3.2 Solo frontend (datos en el navegador)

```bash
npm start                          # http://localhost:8080
```

También sirve `python3 -m http.server 8000` o Live Server. La página no se puede abrir con doble clic (`file://`), porque los navegadores no cargan módulos ES de esa forma. El pie de página dice **Demostración: los datos se guardan en este navegador**.

### 3.3 Con SQL Server

1. Crea una base de datos vacía, por ejemplo `ReportaCampus`, y un usuario con permisos para crear tablas.
2. Instala el controlador:
   ```bash
   pip install -r requirements-sqlserver.txt
   ```
3. En `.env`:
   ```
   DATABASE_URL=mssql+pyodbc://USUARIO:CONTRASENA@SERVIDOR:1433/ReportaCampus?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
   ```
4. Ejecuta `python run.py`. Si la base está vacía, el backend crea las tablas y carga los datos de demostración. Para crear las tablas a mano, usa [`backend/sql/esquema-sqlserver.sql`](../../backend/sql/esquema-sqlserver.sql).

> El código, las pruebas y la integración se verificaron con SQLite. El esquema de SQL Server se genera desde los mismos modelos con el dialecto `mssql` de SQLAlchemy (`python -m app.esquema`), y una prueba revisa que use `NVARCHAR`, `DATETIME2` e `IDENTITY`. La conexión a un servidor SQL Server real no se probó dentro del proyecto.

## 4. Configuración

### 4.1 Backend (`backend/.env`)

Plantilla: [`backend/.env.example`](../../backend/.env.example). El archivo `.env` está en `.gitignore` y no se sube.

| Variable | Para qué | Valor por defecto |
|---|---|---|
| `SECRET_KEY` | Firma de los tokens de sesión. **Obligatoria en producción.** Genera una con `python -c "import secrets; print(secrets.token_hex(32))"`. Si falta, se usa una temporal y las sesiones se cierran al reiniciar. | temporal |
| `DATABASE_URL` | Conexión a la base de datos. Las rutas relativas de SQLite quedan en `backend/instancia/`. | `sqlite:///reportacampus.db` |
| `JWT_HORAS` | Duración de la sesión. | `8` |
| `CORS_ORIGENES` | Dominios que pueden llamar a la API desde otra dirección (separados por coma). | `localhost:8080` y `elone1415.github.io` |
| `AUTO_SEMILLA` | Cargar los datos de demostración si la base está vacía. | `1` |
| `MOSTRAR_CUENTAS_DEMO` | Mostrar las cuentas rápidas en el inicio de sesión. Pon `0` en producción. | `1` |
| `CONTRASENA_INICIAL` | Contraseña de las cuentas que crea el administrador. | `campus2026` |
| `CARPETA_FOTOS` | Dónde se guardan las fotos. | `backend/instancia/fotos` |
| `FOTO_MAX_BYTES` | Tamaño máximo de una foto. | `1500000` |
| `PUERTO` | Puerto de `python run.py`. | `5000` |

### 4.2 Frontend (`src/config/config.js`)

| Valor | Para qué | Valor actual |
|---|---|---|
| `FUENTE_DATOS` | `'auto'` (servidor si lo hay; si no, navegador), `'api'` o `'local'`. | `'auto'` |
| `API_URL` | Dirección de la API si el frontend está en otro dominio (por ejemplo, GitHub Pages con el backend en Render). `null` = la misma dirección de la página. | `null` |
| `API_TIEMPO_MS` | Tiempo máximo de espera de una petición. | `15000` |
| `API_CACHE_MS` | Cuánto se reutiliza la lista de reportes antes de pedirla de nuevo. | `20000` |
| `CONTRASENA_DEMO` | Contraseña de las cuentas de demostración en modo local. | `campus2026` |
| `META_HORAS`, `META_CUMPLIMIENTO` | Meta de atención del panel y de las alertas. | `48`, `85` |

Las rutas, el permiso de cada una y la página de inicio de cada rol están en `src/config/rutas.js`.

## 5. Estructura del código

```
ReportaCampus/
├── index.html                  Estructura de todas las páginas
├── package.json                Scripts y dependencia de desarrollo (Playwright)
├── playwright.config.js        Pruebas de extremo a extremo
├── LICENSE · .gitignore · .editorconfig
├── public/                     Logo, tipografía Lato y Chart.js
├── src/
│   ├── main.js                 Arranque: elige la fuente de datos, sesión y router
│   ├── router.js               Rutas por hash con permisos
│   ├── config/                 config.js, rutas.js
│   ├── models/                 catalogos, reporte, usuario, roles (reglas sin DOM)
│   ├── data/                   Datos de demostración (generador con semilla)
│   ├── services/               Servicios locales (navegador) y auditoría
│   │   └── api/                Cliente HTTP y servicios sobre la API (misma interfaz)
│   ├── components/             Tabla, resumen, detalle, acciones, confirmación,
│   │                           gráficas, carga y error, menú, aviso
│   ├── pages/                  Una por sección
│   ├── utils/                  Formatos, fechas, periodos, CSV, imágenes, DOM
│   └── styles/                 base, layout, components, pages, responsive
├── backend/
│   ├── run.py                  Servidor de desarrollo (API + frontend)
│   ├── requirements*.txt       Dependencias fijadas
│   ├── .env.example            Plantilla de configuración
│   ├── app/
│   │   ├── __init__.py         Fábrica de la aplicación, CORS, errores JSON
│   │   ├── config.py           Lectura de variables de entorno
│   │   ├── modelos.py          Tablas (SQLAlchemy)
│   │   ├── permisos.py         Matriz de permisos (igual a src/models/roles.js)
│   │   ├── validacion.py       Validaciones (mismos mensajes que el frontend)
│   │   ├── seguridad.py        Contraseñas (PBKDF2) y tokens (JWT)
│   │   ├── serializar.py       Formato JSON que espera el frontend
│   │   ├── semilla.py          Carga de los datos de demostración
│   │   ├── esquema.py          Genera el SQL de SQL Server
│   │   ├── rutas/              Endpoints: auth, reportes, usuarios, sistema
│   │   └── servicios/          Lógica: reportes, usuarios, fotos, auditoría
│   ├── datos/semilla.json      Datos de demostración (generado)
│   ├── sql/esquema-sqlserver.sql
│   └── tests/                  pytest
├── scripts/
│   ├── servidor-estatico.mjs   Servidor sin dependencias para el modo local
│   └── exportar-semilla.mjs    Genera backend/datos/semilla.json
├── tests/                      Pruebas unitarias del frontend y e2e/
└── documentacion/
```

## 6. API REST

Todas las rutas empiezan con `/api` y responden JSON con la forma `{ "ok": true, ... }`. Los errores responden `{ "ok": false, "error": "mensaje" }` o, si son de validación, `{ "ok": false, "errores": { "campo": "mensaje" } }`.

Autenticación: `Authorization: Bearer <token>` con el token que devuelve el inicio de sesión.

Códigos: `200`/`201` correcto · `400` datos no válidos · `401` sin sesión o token vencido · `403` sin permiso · `404` no existe · `413` petición demasiado grande · `500` error del servidor.

### 6.1 Sistema y autenticación

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/salud` | público | Estado del servidor: `{ version, baseDatos }`. |
| GET | `/api/catalogos` | público | Categorías y zonas. |
| POST | `/api/auth/login` | público | `{ correo, contrasena }` → `{ token, usuario }`. |
| GET | `/api/auth/yo` | sesión | Usuario del token. |
| POST | `/api/auth/contrasena` | sesión | `{ actual, nueva }`. La nueva debe tener 8 caracteres o más, con letras y números. |
| GET | `/api/auth/cuentas-demo` | público | Cuentas rápidas (vacío si `MOSTRAR_CUENTAS_DEMO=0`). |
| GET | `/api/fotos/{archivo}` | público | Foto de un reporte. |

### 6.2 Reportes

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/reportes` | sesión | Lista. Filtros opcionales: `estado`, `categoria`, `zona`, `prioridad`, `texto`, `autorId`, `responsableId` (o `ninguno`), `abiertos=1`. |
| GET | `/api/reportes/{RC-0001}` | sesión | Un reporte con su historial. |
| POST | `/api/reportes` | todos | `{ categoria, ubicacion, titulo, descripcion, prioridad, fotoUrl? }`. La foto va como *data URL* JPEG, PNG o WebP. |
| PUT | `/api/reportes/{id}` | autor, en Nuevo | Mismos campos. `fotoUrl: null` quita la foto. |
| DELETE | `/api/reportes/{id}` | autor en Nuevo o administrador | Elimina. |
| POST | `/api/reportes/{id}/asignacion` | administrador | `{ responsableId }`. Un reporte Nuevo pasa a En proceso. |
| POST | `/api/reportes/{id}/tomar` | responsable de la categoría | Toma un reporte nuevo sin asignar. |
| POST | `/api/reportes/{id}/estado` | responsable asignado o administrador | `{ estado, nota }`. Resolver y reabrir exigen nota (mínimo 10 caracteres); reabrir es solo del administrador. |
| PATCH | `/api/reportes/{id}/prioridad` | administrador | `{ prioridad }`. |
| POST | `/api/reportes/{id}/notas` | responsable asignado o administrador | `{ nota }`. |
| POST | `/api/reportes/{id}/calificacion` | autor, reporte resuelto, una vez | `{ puntaje: 1-5, comentario? }`. |

Ejemplo:

```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"correo":"diana.rojas@campus.edu.co","contrasena":"campus2026"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

curl -s "localhost:5000/api/reportes?responsableId=u-002&estado=En%20proceso" -H "Authorization: Bearer $TOKEN"
```

Un reporte en la respuesta:

```json
{
  "id": "RC-0814", "titulo": "Gotera sobre una toma eléctrica", "descripcion": "...",
  "categoria": "infraestructura", "ubicacion": "bloque-b", "prioridad": "Alta", "estado": "En proceso",
  "creado": "2026-11-16T19:18:57Z", "resuelto": null,
  "autorId": "u-010", "autor": "Andrés López",
  "responsableId": "u-002", "responsableNombre": "Planta física – Diana Rojas",
  "foto": false, "fotoUrl": null, "calificacion": null,
  "historial": [{ "estado": "Nuevo", "fecha": "2026-11-16T19:18:57Z", "nota": "Reporte registrado por la comunidad.", "por": "Andrés López" }]
}
```

### 6.3 Usuarios y administración

| Método | Ruta | Quién | Descripción |
|---|---|---|---|
| GET | `/api/usuarios` | administrador | Filtros: `texto`, `rol`, `activo=si/no`. |
| GET | `/api/usuarios/responsables?categoria=` | administrador | Responsables activos; primero los de la categoría. |
| GET | `/api/usuarios/{u-001}` | administrador | Un usuario. |
| POST | `/api/usuarios` | administrador | `{ nombre, correo, rol, area?, categorias? }`. Entra con `CONTRASENA_INICIAL`. |
| PUT | `/api/usuarios/{id}` | administrador | Mismos campos. |
| PATCH | `/api/usuarios/{id}/activo` | administrador | `{ activo: true/false }`. |
| DELETE | `/api/usuarios/{id}` | administrador | Sus reportes se conservan con el nombre guardado. |
| GET | `/api/auditoria?limite=50` | administrador | Últimas acciones (máximo 200). |
| POST | `/api/datos/restablecer` | administrador | Borra todo y carga los datos de demostración. |

Reglas que la API rechaza con `400`: eliminar o desactivar la propia cuenta, dejar el sistema sin administrador activo, y eliminar, desactivar o cambiar de rol a un responsable con reportes sin resolver.

## 7. Base de datos

| Tabla | Contenido |
|---|---|
| `usuarios` | Nombre, correo único, `clave_hash` (PBKDF2-SHA256 con sal, 600 000 iteraciones), rol, área, activo. |
| `categorias`, `zonas` | Catálogos. |
| `responsable_categorias` | Qué categorías atiende cada responsable. |
| `reportes` | Datos del reporte, autor y responsable (con el nombre copiado para conservarlo), foto, calificación y fechas. |
| `historial` | Cada cambio de un reporte: estado, nota, quién y cuándo. |
| `auditoria` | Acciones que cambiaron datos, para la página Actividad. |

Diagrama: [modelo de datos](../diagramas/modelo-datos.md). Las fechas se guardan en UTC y se envían en ISO 8601 con `Z`; el navegador las muestra en la hora local.

**Datos de demostración.** Los reportes simulados se generan en el frontend (`src/data/semilla.js`). Para que el backend use los mismos, `npm run semilla` (o `node scripts/exportar-semilla.mjs`) escribe `backend/datos/semilla.json` con las fechas como "horas antes de la exportación". Al cargarlos, el backend corre las fechas por días completos hasta hoy.

## 8. Seguridad

- **Contraseñas:** cifradas con PBKDF2 en el servidor. El inicio de sesión responde igual si el correo no existe que si la contraseña está mal.
- **Sesión:** token JWT firmado con `SECRET_KEY` que vence en `JWT_HORAS`. En cada petición se vuelve a leer el usuario: una cuenta desactivada o eliminada deja de tener acceso de inmediato.
- **Permisos:** el backend revisa cada operación con la misma matriz del frontend. Una prueba (`tests/funciones-finales.test.js`) falla si las dos matrices se diferencian.
- **Fotos:** se valida que sean JPEG, PNG o WebP por su contenido (no por el nombre), se limita su tamaño y se guardan con nombre aleatorio.
- **Archivos públicos:** Flask solo entrega `index.html`, `src/` y `public/`. Una prueba revisa que no se pueda llegar a `backend/`, `.env` ni `.git` (incluido `src/../`).
- **HTML:** todo texto escrito por usuarios se escapa antes de mostrarse.
- **Secretos:** `.env` no se sube al repositorio. La contraseña `campus2026` es pública a propósito: es de las cuentas de demostración. En producción hay que cambiar `CONTRASENA_INICIAL`, poner `MOSTRAR_CUENTAS_DEMO=0` y pedir a los usuarios que cambien su contraseña.
- **Modo local:** sin servidor no hay seguridad real (los datos están en el navegador de cada persona y se pueden modificar). Sirve solo para la demostración.

## 9. Pruebas

| Nivel | Herramienta | Comando | Resultado actual |
|---|---|---|---|
| Unitarias del frontend | `node:test` | `npm test` | 57 de 57 |
| Backend (API y reglas) | pytest | `cd backend && pip install -r requirements-dev.txt && pytest` | 33 de 33 |
| De extremo a extremo | Playwright | `npm install && npx playwright install chromium && npm run test:e2e` | 33 de 33 (y 3 que solo aplican con servidor) |

Las pruebas de extremo a extremo levantan solas los dos servidores (`scripts/servidor-estatico.mjs` y `backend/run.py` en el puerto 5055 con una base `e2e.db`) y corren cada caso en modo local y con servidor. Si tu Python no se llama `python3`, indícalo con `PYTHON=ruta/a/python npm run test:e2e`. Para usar el Chrome instalado en lugar del que descarga Playwright: `PW_CHANNEL=chrome npm run test:e2e`.

Resultados guardados y plan completo: [documentacion/pruebas](../pruebas/plan-de-pruebas.md).

## 10. Despliegue

### Frontend en GitHub Pages (publicado)

El repositorio se publica desde la rama `main`, en la raíz, en <https://elone1415.github.io/ReportaCampus/>. Como ahí no hay backend, la aplicación funciona en modo navegador con los datos de demostración. Cada `git push` a `main` actualiza la página en uno o dos minutos.

### Backend en un servidor

El backend no está publicado en internet; se ejecuta en local (sección 3.1). Para publicarlo, por ejemplo en Render o Azure App Service:

1. Crea un servicio web de Python con la carpeta `backend/` como raíz.
2. Comando de instalación: `pip install -r requirements.txt gunicorn` (más `pyodbc` si usas SQL Server).
3. Comando de inicio: `gunicorn "run:app" --bind 0.0.0.0:$PORT`.
4. Variables de entorno: `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGENES`, `MOSTRAR_CUENTAS_DEMO=0` y `CONTRASENA_INICIAL`.
5. Si el frontend sigue en GitHub Pages, en `src/config/config.js` pon `FUENTE_DATOS: 'api'` y `API_URL: 'https://tu-backend/api'`, y agrega `https://elone1415.github.io` a `CORS_ORIGENES`. Si el frontend lo entrega el mismo backend, no hay que cambiar nada.
6. Usa una base de datos con almacenamiento persistente (SQL Server o Azure SQL). En servicios gratuitos el disco se borra al reiniciar, y con él la base SQLite y las fotos.

## 11. Mantenimiento

| Para | Hacer |
|---|---|
| Agregar una categoría o zona | Editar `src/models/catalogos.js` (y el responsable en `src/data/usuarios.js`), ejecutar `npm run semilla` y `flask --app run semilla`. |
| Cambiar un permiso | Cambiarlo en `src/models/roles.js` **y** en `backend/app/permisos.py`. `npm test` avisa si no coinciden. |
| Agregar una página | Sección en `index.html`, módulo en `src/pages/`, ruta en `src/config/rutas.js` y registro en `src/main.js`. |
| Cambiar un modelo de la base | Editar `backend/app/modelos.py`, regenerar `backend/sql/esquema-sqlserver.sql` con `python -m app.esquema > sql/esquema-sqlserver.sql` y volver a crear la base (o migrarla a mano). |
| Actualizar dependencias | Cambiar las versiones fijadas en `backend/requirements.txt` y `package.json`, y correr las tres baterías de pruebas. |

## 12. Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| Página en blanco al abrir `index.html` con doble clic | Los módulos ES no cargan con `file://`. Usa `python run.py`, `npm start` o Live Server. |
| El pie dice "Demostración…" aunque el backend está corriendo | Estás abriendo la página desde otro servidor (por ejemplo, Live Server). Ábrela en <http://localhost:5000>. |
| "Tu sesión terminó" justo después de reiniciar el backend | Falta `SECRET_KEY` en `.env` y se generó una nueva. Configúrala. |
| `ModuleNotFoundError: flask` | No se activó el entorno virtual o faltó `pip install -r requirements.txt`. |
| Error del controlador ODBC con SQL Server | Instala el ODBC Driver 18 y revisa el parámetro `driver=` de `DATABASE_URL`. |
| La página publicada no muestra los cambios | GitHub Pages tarda uno o dos minutos; recarga con `Cmd + Shift + R` o `Ctrl + F5`. |
