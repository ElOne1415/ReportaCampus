# ADR-006. Pruebas unitarias con `node:test`

**Estado:** aceptada · Fase II

## Contexto

La guía pide pruebas y evidencias. El proyecto no tiene dependencias y queríamos mantenerlo así.

## Decisión

Usar el ejecutor de pruebas incluido en Node.js 20 o superior (`node:test` y `node:assert`). Las pruebas están en `tests/` y se corren con `npm test`. Prueban modelos y servicios, que no dependen del DOM; los servicios usan un almacén en memoria.

## Consecuencias

- No hay que instalar Jest ni Mocha; `npm test` funciona apenas se clona el repositorio.
- La interfaz se probó a mano en el navegador siguiendo el [plan de pruebas](../pruebas/plan-de-pruebas.md). En la entrega final se automatizarán esos casos con Playwright.
