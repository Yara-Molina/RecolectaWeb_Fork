import { useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
import type { Empleado } from "../EmpleadosPage";

export interface CamionOption {
  camion_id: number;
  placa: string;
  modelo: string;
  nombre_disponibilidad: string;
}

interface Props {
  empleado: Empleado;
  camiones: CamionOption[];
  camionActualId: number | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (camionId: number) => void;
  onDesasignar?: () => void;
}

export default function AsignarCamionModal({
  empleado,
  camiones,
  camionActualId,
  saving = false,
  onCancel,
  onSave,
  onDesasignar,
}: Props) {
  const camionesOperativos = camiones.filter(
    (c) => c.nombre_disponibilidad.toUpperCase() === "OPERATIVO",
  );
  const opciones = camionesOperativos.length > 0 ? camionesOperativos : camiones;

  const [camionId, setCamionId] = useState<number>(
    () => camionActualId ?? opciones[0]?.camion_id ?? 0,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!camionId) return;
    onSave(camionId);
  }

  return (
    <form className="emp-form" onSubmit={handleSubmit}>
      <p className="emp-assign-intro">
        Asignar camión a <strong>{empleado.nombre}</strong> ({empleado.email}).
        El conductor necesita esta vinculación para iniciar rutas en la app móvil.
      </p>

      <div className="emp-field emp-full">
        <label htmlFor="camion-select">Camión</label>
        <select
          id="camion-select"
          value={camionId}
          onChange={(e) => setCamionId(Number(e.target.value))}
          disabled={opciones.length === 0}
        >
          {opciones.length === 0 && <option value={0}>No hay camiones disponibles</option>}
          {opciones.map((c) => (
            <option key={c.camion_id} value={c.camion_id}>
              {c.placa} — {c.modelo}
              {c.nombre_disponibilidad ? ` (${c.nombre_disponibilidad})` : ""}
            </option>
          ))}
        </select>
        {camionesOperativos.length === 0 && camiones.length > 0 && (
          <span className="emp-field-hint">
            No hay camiones operativos; se muestran todos los registrados.
          </span>
        )}
      </div>

      <div className="emp-form-actions emp-form-actions-split">
        {camionActualId && onDesasignar ? (
          <button
            type="button"
            className="emp-btn danger"
            onClick={onDesasignar}
            disabled={saving}
          >
            Quitar asignación
          </button>
        ) : (
          <span />
        )}

        <div className="emp-form-actions">
          <button type="button" className="emp-btn secondary" onClick={onCancel} disabled={saving}>
            <FiX /> Cancelar
          </button>
          <button type="submit" className="emp-btn primary" disabled={saving || !camionId}>
            <FiSave /> {saving ? "Guardando..." : "Asignar camión"}
          </button>
        </div>
      </div>
    </form>
  );
}
