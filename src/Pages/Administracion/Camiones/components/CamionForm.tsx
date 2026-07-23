// src/Pages/Administracion/Camiones/components/CamionForm.tsx
import { useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
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

// Inserta un guion en cada transición letra<->dígito (p. ej. ABC123A ->
// ABC-123-A, AB123A -> AB-123-A). Se adapta a prefijos de letras de
// longitud variable porque no asume una cantidad fija de caracteres.
function formatPlaca(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  let result = "";
  for (let i = 0; i < clean.length; i++) {
    if (i > 0 && /[0-9]/.test(clean[i - 1]) !== /[0-9]/.test(clean[i])) {
      result += "-";
    }
    result += clean[i];
  }
  return result;
}

export default function CamionForm({ modo, camion, tiposCamion, saving = false, onCancel, onSubmit }: Props) {
  const [placa, setPlaca] = useState(() => formatPlaca(camion?.placa ?? ""));
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
    if (modelo.trim().length < 50) return setError("El modelo debe tener al menos 50 caracteres.");
    if (modelo.trim().length > 100) return setError("El modelo no puede superar 100 caracteres.");
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
          <input
            value={placa}
            onChange={(e) => setPlaca(formatPlaca(e.target.value))}
            placeholder="CHP-123-A"
            maxLength={10}
          />
          <span className="field-hint">Escribe solo letras y números; las mayúsculas y guiones se agregan automáticamente.</span>
        </div>

        <div className="field">
          <label>Modelo</label>
          <input
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Freightliner M2 2020"
            minLength={50}
            maxLength={100}
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
          <FiX />
          <span>Cancelar</span>
        </button>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          <FiSave />
          <span>{saving ? "Guardando..." : modo === "CREAR" ? "Crear" : "Guardar cambios"}</span>
        </button>
      </div>
    </form>
  );
}
