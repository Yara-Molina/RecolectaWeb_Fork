import Swal, { type SweetAlertOptions } from 'sweetalert2';
import './alertas.css';

// Diálogos de la aplicación. Sustituyen a alert() y window.confirm(), que
// además de romper la estética muestran la URL del host en la cabecera —
// visible y feo cuando se sirve por ngrok.
//
// Los colores salen de la paleta ya usada en el CSS de la app: teal #0F676C
// como primario, #E24B4A para error y #E88D1D para aviso.

const BASE: SweetAlertOptions = {
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'rec-popup',
    title: 'rec-titulo',
    htmlContainer: 'rec-texto',
    actions: 'rec-acciones',
    confirmButton: 'rec-btn rec-btn-primario',
    cancelButton: 'rec-btn rec-btn-secundario',
    icon: 'rec-icono',
  },
};

// Los mensajes existentes usan saltos de línea; SweetAlert renderiza HTML.
function aHtml(texto?: string): string | undefined {
  if (!texto) return undefined;
  const escapado = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escapado.replace(/\n/g, '<br>');
}

export function alertaExito(titulo: string, texto?: string) {
  return Swal.fire({
    ...BASE,
    icon: 'success',
    title: titulo,
    html: aHtml(texto),
    confirmButtonText: 'Aceptar',
  });
}

export function alertaError(titulo: string, texto?: string) {
  return Swal.fire({
    ...BASE,
    icon: 'error',
    title: titulo,
    html: aHtml(texto),
    confirmButtonText: 'Entendido',
  });
}

export function alertaInfo(titulo: string, texto?: string) {
  return Swal.fire({
    ...BASE,
    icon: 'info',
    title: titulo,
    html: aHtml(texto),
    confirmButtonText: 'Cerrar',
  });
}

export function alertaAviso(titulo: string, texto?: string) {
  return Swal.fire({
    ...BASE,
    icon: 'warning',
    title: titulo,
    html: aHtml(texto),
    confirmButtonText: 'Aceptar',
  });
}

// Devuelve true solo si el usuario confirma, para sustituir a window.confirm
// sin cambiar la forma de los `if` que ya existen.
export async function confirmar(
  titulo: string,
  texto?: string,
  textoConfirmar = 'Confirmar',
): Promise<boolean> {
  const { isConfirmed } = await Swal.fire({
    ...BASE,
    icon: 'question',
    title: titulo,
    html: aHtml(texto),
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    focusCancel: true,
  });
  return isConfirmed;
}

// Para acciones destructivas: mismo flujo que confirmar() pero con el botón
// principal en rojo, para que borrar no se parezca a guardar.
export async function confirmarEliminacion(
  titulo: string,
  texto?: string,
  textoConfirmar = 'Eliminar',
): Promise<boolean> {
  const { isConfirmed } = await Swal.fire({
    ...BASE,
    icon: 'warning',
    title: titulo,
    html: aHtml(texto),
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: 'Cancelar',
    focusCancel: true,
    customClass: {
      ...(BASE.customClass as object),
      confirmButton: 'rec-btn rec-btn-peligro',
    },
  });
  return isConfirmed;
}
