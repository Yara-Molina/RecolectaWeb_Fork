// src/Pages/Administracion/Camiones/components/CamionForm.tsx
import { useState } from "react";
import { ESTADOS_DISPONIBILIDAD } from "../CamionesPage";
import type { Camion, CamionPayload, TipoCamion } from "../CamionesPage";

interface Props {
  modo: "CREAR" | "EDITAR";
  camion: Camion | null;
  tiposCamion: TipoCamion[];
  saving?: boolean;
  onCancel: () => void;
  onSubmit: (data: CamionPayload) => void;
}

export default function CamionForm({ modo, camion, tiposCamion, saving = false, onCancel, onSubmit }: Props) {
  const [placa, setPlaca] = useState(() => camion?.placa ?? "");
  const [modelo, setModelo] = useState(() => camion?.modelo ?? "");
  const [tipoCamionId, setTipoCamionId] = useState<number>(
    () => camion?.tipo_camion_id ?? tiposCamion[0]?.tipo_camion_id ?? 0
  );
  const [esRentado, setEsRentado] = useState(() => camion?.es_rentado ?? false);
  const [disponibilidadId, setDisponibilidadId] = useState<number>(() => camion?.disponibilidad_id ?? 1);

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!placa.trim()) return setError("La placa es obligatoria.");
    if (!modelo.trim()) return setError("El modelo es obligatorio.");
    if (!tipoCamionId) return setError("El tipo de camión es obligatorio.");

    onSubmit({
      placa: placa.trim().toUpperCase(),
      modelo: modelo.trim(),
      tipo_camion_id: tipoCamionId,
      es_rentado: esRentado,
      disponibilidad_id: disponibilidadId,
    });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <div className="form-grid">
        <div className="field">
          <label>Placa</label>
          <input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="CHP-123-A" />
        </div>

        <div className="field">
          <label>Modelo</label>
          <input
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Freightliner M2 2020"
          />
        </div>

        <div className="field">
          <label>Tipo de camión</label>
          <select value={tipoCamionId} onChange={(e) => setTipoCamionId(Number(e.target.value))}>
            {tiposCamion.length === 0 && <option value={0}>Sin tipos disponibles</option>}
            {tiposCamion.map((t) => (
              <option key={t.tipo_camion_id} value={t.tipo_camion_id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Estado / Disponibilidad</label>
          <select value={disponibilidadId} onChange={(e) => setDisponibilidadId(Number(e.target.value))}>
            {ESTADOS_DISPONIBILIDAD.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label className="switch">
            <input
              type="checkbox"
              checked={esRentado}
              onChange={(e) => setEsRentado(e.target.checked)}
            />
            <span>¿Es rentado?</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando..." : modo === "CREAR" ? "Crear" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
