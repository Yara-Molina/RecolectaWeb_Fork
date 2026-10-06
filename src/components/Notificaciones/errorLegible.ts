import { ApiError } from '../../services/api';

export interface ErrorLegible {
  titulo: string;
  mensaje: string;
  tipo: 'servidor' | 'usuario';
}

export function errorLegible(err: unknown, tituloPorDefecto = 'No se pudo completar la acción'): ErrorLegible {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return { titulo: 'Sin conexión con el servidor', mensaje: err.message, tipo: 'servidor' };
    }
    if (err.status >= 500) {
      return { titulo: 'Servidor no disponible', mensaje: err.message, tipo: 'servidor' };
    }
    return { titulo: tituloPorDefecto, mensaje: err.message, tipo: 'usuario' };
  }
  return {
    titulo: tituloPorDefecto,
    mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    tipo: 'servidor',
  };
}
