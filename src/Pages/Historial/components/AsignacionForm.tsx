// src/Pages/Historial/components/AsignacionForm.tsx
import { useState } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import type { AsignacionPayload, Camion, Conductor, HistorialAsignacion } from '../Historial';

interface Props {
  modo: 'CREAR' | 'EDITAR';
  asignacion: HistorialAsignacion | null;
  camiones: Camion[];
  conductores: Conductor[];
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (data: AsignacionPayload) => void;
}

export default function AsignacionForm({
  modo,
  asignacion,
  camiones,
  conductores,
  saving = false,
  onCancel,
  onSubmit,
}: Props) {
  const [idCamion, setIdCamion] = useState<number>(
    () => asignacion?.id_camion ?? camiones[0]?.camion_id ?? 0
  );
  const [idConductor, setIdConductor] = useState<number>(
    () => asignacion?.id_chofer ?? conductores[0]?.id ?? 0
  );
  const [fechaAsignacion, setFechaAsignacion] = useState(
    () => asignacion?.fecha_asignacion?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [fechaBaja, setFechaBaja] = useState(() => asignacion?.fecha_baja?.slice(0, 10) ?? '');

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!idCamion) return setError('Selecciona un camion.');
    if (!idConductor) return setError('Selecciona un conductor.');
    if (!fechaAsignacion) return setError('La fecha de asignacion es obligatoria.');
    if (fechaBaja && fechaBaja < fechaAsignacion) {
      return setError('La fecha de baja no puede ser anterior a la fecha de asignacion.');
    }

    onSubmit({
      id_camion: idCamion,
      id_chofer: idConductor,
      fecha_asignacion: fechaAsignacion,
      fecha_baja: fechaBaja,
    });
  }

  return (
    <form className="historial form" onSubmit={handleSubmit}>
      {error && <div className="historial form-error">{error}</div>}

      <div className="historial form-grid">
        <div className="historial field">
          <label>Camion</label>
          <select value={idCamion} onChange={(e) => setIdCamion(Number(e.target.value))}>
            {camiones.length === 0 && <option value={0}>Sin camiones disponibles</option>}
            {camiones.map((c) => (
              <option key={c.camion_id} value={c.camion_id}>
                {c.placa}
              </option>
            ))}
          </select>
        </div>

        <div className="historial field">
          <label>Conductor</label>
          <select value={idConductor} onChange={(e) => setIdConductor(Number(e.target.value))}>
            {conductores.length === 0 && <option value={0}>Sin conductores disponibles</option>}
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="historial field">
          <label>Fecha de asignacion</label>
          <input
            type="date"
            value={fechaAsignacion}
            onChange={(e) => setFechaAsignacion(e.target.value)}
          />
        </div>

        <div className="historial field">
          <label>Fecha de baja (opcional)</label>
          <input type="date" value={fechaBaja} onChange={(e) => setFechaBaja(e.target.value)} />
        </div>
      </div>

      <div className="historial form-actions">
        <button type="button" className="historial btn-cancelar" onClick={onCancel} disabled={saving}>
          <FiX />
          <span>Cancelar</span>
        </button>

        <button type="submit" className="historial btn-guardar" disabled={saving}>
          <FiSave />
          <span>{saving ? 'Guardando...' : modo === 'CREAR' ? 'Crear' : 'Guardar cambios'}</span>
        </button>
      </div>
    </form>
  );
}
