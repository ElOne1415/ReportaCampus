/* ==========================================================
   Servidor estático mínimo para probar el frontend en modo
   local (sin backend). No necesita dependencias.

   Uso:  node scripts/servidor-estatico.mjs [puerto]   (8080 por defecto)
   ========================================================== */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUERTO = Number(process.argv[2] || process.env.PORT || 8080);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };
// Solo se publica lo que necesita el navegador
const PERMITIDO = ['index.html', 'src' + sep, 'public' + sep];

createServer(async (req, res) => {
  const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[/\\]+/, '') || 'index.html';
  if (!PERMITIDO.some((p) => ruta === p || ruta.startsWith(p))) { res.writeHead(404).end('No encontrado'); return; }
  try {
    const contenido = await readFile(join(RAIZ, ruta));
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(contenido);
  } catch (e) {
    res.writeHead(404).end('No encontrado');
  }
}).listen(PUERTO, '127.0.0.1', () => console.log('ReportaCampus (modo local) en http://localhost:' + PUERTO));
