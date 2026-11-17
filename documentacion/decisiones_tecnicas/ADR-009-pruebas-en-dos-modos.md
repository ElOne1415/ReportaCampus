# ADR-009. Pruebas de extremo a extremo con Playwright en los dos modos

**Estado:** aceptada · entrega final (v1.0)

## Contexto

Las pruebas unitarias (ADR-006) y las del backend (pytest) prueban cada capa por separado, pero no que el frontend, la API y la base de datos funcionen juntos, ni que los dos modos (navegador y servidor) se comporten igual.

## Decisión

- Pruebas con Playwright en `tests/e2e/`, con una sola dependencia de desarrollo (`@playwright/test`, versión fijada).
- Dos proyectos en `playwright.config.js`: **local**, con un servidor estático sin dependencias, y **servidor**, con `backend/run.py`, una base SQLite propia y el puerto 5055. Playwright levanta los dos solos.
- Antes de cada caso se restablecen los datos y se borra el almacenamiento del navegador, y al terminar se revisa que no haya errores de JavaScript.
- Las pruebas de fallos (sin conexión, error 500, token no válido) interceptan las peticiones con `page.route` y solo corren con servidor.

## Consecuencias

- Cada caso confirma también la integración entre frontend, API y base de datos.
- Las pruebas encontraron dos errores reales de la interfaz en celular, ya corregidos (ver el [plan de pruebas](../pruebas/plan-de-pruebas.md#3-errores-encontrados-por-las-pruebas-y-corregidos)).
- Hay que instalar el navegador de Playwright (`npx playwright install chromium`) o usar el Chrome instalado con `PW_CHANNEL=chrome`.
