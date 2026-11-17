/* ==========================================================
   Pruebas de extremo a extremo (Playwright)
   ----------------------------------------------------------
   Los mismos casos corren en dos proyectos:
     - local:    frontend solo, datos en el navegador
     - servidor: frontend servido por el backend Flask (API + SQLite)
   Antes de cada prueba se vuelven a cargar los datos de
   demostración (ver tests/e2e/ayudas.js).

   Requisitos: npm install, npx playwright install chromium y las
   dependencias del backend (pip install -r backend/requirements.txt).
   Uso: npm run test:e2e
   ========================================================== */
import { defineConfig } from '@playwright/test';

const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // PW_CHANNEL=chrome usa el Chrome instalado en lugar del que descarga Playwright
    channel: process.env.PW_CHANNEL || undefined,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'local', use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'servidor', use: { baseURL: 'http://127.0.0.1:5055' } }
  ],
  webServer: [
    {
      command: 'node scripts/servidor-estatico.mjs 4173',
      url: 'http://127.0.0.1:4173/index.html',
      reuseExistingServer: !process.env.CI
    },
    {
      command: PYTHON + ' backend/run.py',
      url: 'http://127.0.0.1:5055/api/salud',
      reuseExistingServer: false,
      env: { PUERTO: '5055', DATABASE_URL: 'sqlite:///e2e.db', SECRET_KEY: 'solo-para-pruebas-e2e', MOSTRAR_CUENTAS_DEMO: '1' }
    }
  ]
});
