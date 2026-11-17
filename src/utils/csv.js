/* Generación y descarga de archivos CSV */

/**
 * Convierte filas en texto CSV. Usa punto y coma como separador
 * y BOM al inicio para que Excel en español abra bien las
 * columnas y las tildes.
 */
export function aCSV(filas) {
  const celda = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
}

/** Descarga un texto como archivo en el navegador. */
export function descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
