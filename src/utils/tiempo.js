/* Constantes y cálculos de tiempo */

export const HORA = 3600 * 1000;
export const DIA = 24 * HORA;

/** Horas transcurridas entre dos fechas. */
export const horasEntre = (desde, hasta) => (hasta - desde) / HORA;

export const inicioDia = (fecha) => {
  const x = new Date(fecha);
  x.setHours(0, 0, 0, 0);
  return x;
};
