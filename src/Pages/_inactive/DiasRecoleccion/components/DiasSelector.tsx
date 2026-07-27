import { useState } from "react";

interface DiaRecoleccionConfig {
  id: number;
  ruta: string;
  colonia: string;
  dias: string[];
  turno: "Matutino" | "Vespertino";
  estado: "Activo" | "Inactivo";
  fechaRegistro: string;
}

interface Props {
  initialData: DiaRecoleccionConfig | null;
  onCancel: () => void;
  onSave: (
    data: Omit<DiaRecoleccionConfig, "id" | "fechaRegistro">
  ) => void;
}

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Turno = DiaRecoleccionConfig["turno"];
type Estado = DiaRecoleccionConfig["estado"];

export default function DiasRecoleccionForm({
  initialData,
  onCancel,
  onSave,
}: Props) {
  const [ruta, setRuta] = useState(() => initialData?.ruta ?? "");
  const [colonia, setColonia] = useState(() => initialData?.colonia ?? "");
  const [dias, setDias] = useState<string[]>(() => initialData?.dias ?? []);
  const [turno, setTurno] = useState<Turno>(() => initialData?.turno ?? "Matutino");
  const [estado, setEstado] = useState<Estado>(() => initialData?.estado ?? "Activo");

  const toggleDia = (dia: string) => {
    setDias((prev) =>
      prev.includes(dia)
        ? prev.filter((d) => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruta || !colonia || dias.length === 0) {
      alert("Completa todos los campos.");
      return;
    }

    onSave({ ruta, colonia, dias, turno, estado });
  };

  return (
    <form onSubmit={handleSubmit} className="dias dr-form">
      <div className="dias dr-form-group">
        <label htmlFor="ruta">Ruta *</label>
        <input
          id="ruta"
          type="text"
          placeholder="Ej: Ruta 01"
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          className="dias dr-form-input"
          required
        />
      </div>

      <div className="dias dr-form-group">
        <label htmlFor="colonia">Colonia *</label>
        <input
          id="colonia"
          type="text"
          placeholder="Ej: Centro"
          value={colonia}
          onChange={(e) => setColonia(e.target.value)}
          className="dias dr-form-input"
          required
        />
      </div>

      <div className="dias dr-form-group">
        <label>Días de recolección *</label>
        <div className="dias dr-dias-grid">
          {DIAS_SEMANA.map((dia) => (
            <label key={dia} className="dias dr-dia-checkbox">
              <input
                type="checkbox"
                checked={dias.includes(dia)}
                onChange={() => toggleDia(dia)}
              />
              <span>{dia}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="dias dr-form-group">
        <label>Turno *</label>
        <div className="dias dr-turno-group">
          <label className="dias dr-turno-option">
            <input
              type="radio"
              name="turno"
              value="Matutino"
              checked={turno === "Matutino"}
              onChange={(e) => setTurno(e.target.value as Turno)}
            />
            <span>Matutino</span>
          </label>
          <label className="dias dr-turno-option">
            <input
              type="radio"
              name="turno"
              value="Vespertino"
              checked={turno === "Vespertino"}
              onChange={(e) => setTurno(e.target.value as Turno)}
            />
            <span>Vespertino</span>
          </label>
        </div>
      </div>

      <div className="dias dr-form-group">
        <label htmlFor="estado">Estado *</label>
        <select
          id="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as Estado)}
          className="dias dr-form-select"
        >
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="dias dr-form-actions">
        <button 
          type="button" 
          onClick={onCancel}
          className="dias dr-btn-cancel"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="dias dr-btn-save"
        >
          {initialData ? "Guardar Cambios" : "Crear Configuración"}
        </button>
      </div>
    </form>
  );
}
