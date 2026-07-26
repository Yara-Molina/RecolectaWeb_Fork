// src/Pages/Administracion/RellenosSanitarios/components/RellenoForm.tsx
import { useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
import type { RellenoSanitario, RellenoSanitarioPayload } from "../RellenosSanitariosPage";

interface Props {
  initialData: RellenoSanitario | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (data: RellenoSanitarioPayload) => void;
}

export default function RellenoForm({
  initialData,
  saving = false,
  onCancel,
  onSave,
}: Props) {
  const [nombre, setNombre] = useState(() => initialData?.nombre ?? "");
  const [direccion, setDireccion] = useState(() => initialData?.direccion ?? "");
  const [capacidadToneladas, setCapacidadToneladas] = useState<number>(
    () => initialData?.capacidad_toneladas ?? 0
  );
  const [esRentado, setEsRentado] = useState(() => initialData?.es_rentado ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // El backend sólo exige "nombre"; el resto tiene valores por defecto.
    if (!nombre.trim()) {
      setError("El nombre del relleno es obligatorio.");
      return;
    }

    onSave({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      capacidad_toneladas: Number(capacidadToneladas) || 0,
      es_rentado: esRentado,
    });
  };

  return (
    <form className="rs-form" onSubmit={handleSubmit}>
      {error && <div className="rs-form-error">{error}</div>}

      <div className="rs-form-grid">
        <div className="rs-field rs-field-full">
          <label>Nombre del Relleno *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Relleno Sanitario Norte"
            maxLength={100}
            disabled={saving}
          />
        </div>

        <div className="rs-field rs-field-full">
          <label>Dirección</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Carretera Federal Km 12, Zona Industrial"
            maxLength={255}
            disabled={saving}
          />
        </div>

        <div className="rs-field">
          <label>Capacidad (Toneladas)</label>
          <input
            type="number"
            min={0}
            value={capacidadToneladas}
            onChange={(e) => setCapacidadToneladas(Number(e.target.value))}
            placeholder="Ej: 1500"
            disabled={saving}
          />
        </div>

        <div className="rs-field">
          <label>&nbsp;</label>
          <label className="rs-checkbox">
            <input
              type="checkbox"
              checked={esRentado}
              onChange={(e) => setEsRentado(e.target.checked)}
              disabled={saving}
            />
            ¿Es rentado?
          </label>
        </div>
      </div>

      <div className="rs-form-actions">
        <button type="button" className="rs-btn rs-btn-secondary" onClick={onCancel} disabled={saving}>
          <FiX />
          <span>Cancelar</span>
        </button>

        <button type="submit" className="rs-btn rs-btn-primary" disabled={saving}>
          <FiSave />
          <span>{saving ? "Guardando..." : initialData ? "Guardar Cambios" : "Crear Relleno"}</span>
        </button>
      </div>
    </form>
  );
}
