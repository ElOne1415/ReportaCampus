/* Procesamiento de imágenes en el navegador */

/**
 * Reduce una imagen a `max` píxeles en su lado mayor y la devuelve
 * como data URL JPEG, para que ocupe poco espacio al guardarla.
 */
export function reducirImagen(archivo, max) {
  return new Promise((ok, falla) => {
    const lector = new FileReader();
    lector.onerror = falla;
    lector.onload = () => {
      const img = new Image();
      img.onerror = falla;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(img.width * k);
        lienzo.height = Math.round(img.height * k);
        lienzo.getContext('2d').drawImage(img, 0, 0, lienzo.width, lienzo.height);
        ok(lienzo.toDataURL('image/jpeg', 0.8));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
