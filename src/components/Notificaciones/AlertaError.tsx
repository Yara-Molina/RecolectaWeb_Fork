import { FiAlertCircle, FiWifiOff, FiX } from 'react-icons/fi';
import type { ErrorLegible } from './errorLegible';
import './AlertaError.css';

interface Props {
  error: ErrorLegible;
  onCerrar?: () => void;
}

export default function AlertaError({ error, onCerrar }: Props) {
  const Icono = error.tipo === 'servidor' ? FiWifiOff : FiAlertCircle;
  return (
    <div className={`alerta-error alerta-error--${error.tipo}`} role="alert">
      <Icono className="alerta-error-icono" aria-hidden="true" />
      <div className="alerta-error-texto">
        <strong>{error.titulo}</strong>
        <span>{error.mensaje}</span>
      </div>
      {onCerrar && (
        <button type="button" className="alerta-error-cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
          <FiX />
        </button>
      )}
    </div>
  );
}
