/* ==========================================================
   Componente: ventana de confirmación
   Reemplaza a window.confirm para acciones que no se pueden
   deshacer, como eliminar.
   ========================================================== */
const $ = (id) => document.getElementById(id);

/**
 * @param {{ titulo: string, mensaje: string, boton?: string }} op
 * @returns {Promise<boolean>} true si el usuario confirma
 */
export function confirmar({ titulo, mensaje, boton = 'Confirmar' }) {
  const d = $('confirmar');
  $('cTitulo').textContent = titulo;
  $('cMensaje').textContent = mensaje;
  $('cSi').textContent = boton;
  return new Promise((resolver) => {
    const cerrar = (valor) => {
      $('cSi').removeEventListener('click', si);
      $('cNo').removeEventListener('click', no);
      d.removeEventListener('cancel', no);
      d.close();
      resolver(valor);
    };
    const si = () => cerrar(true);
    const no = (e) => { if (e) e.preventDefault(); cerrar(false); };
    $('cSi').addEventListener('click', si);
    $('cNo').addEventListener('click', no);
    d.addEventListener('cancel', no);
    d.showModal();
    $('cNo').focus();
  });
}
