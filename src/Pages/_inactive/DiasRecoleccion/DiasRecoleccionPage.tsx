// DiasRecoleccionPage.tsx
import { useMemo, useState } from "react";
import "./diasRecoleccion.css";

import DiasRecoleccionTable from "./components/ConfigTable";
import DiasRecoleccionForm from "./components/DiasSelector";

export interface DiaRecoleccionConfig {
  id: number;
  ruta: string;
  colonia: string;
  dias: string[];
  turno: "Matutino" | "Vespertino";
  estado: "Activo" | "Inactivo";
  fechaRegistro: string;
}

const MOCK_DATA: DiaRecoleccionConfig[] = [
  {
    id: 1,
    ruta: "Ruta 01",
    colonia: "Centro",
    dias: ["Lunes", "Miércoles", "Viernes"],
    turno: "Matutino",
    estado: "Activo",
    fechaRegistro: "2026-02-01",
  },
  {
    id: 2,
    ruta: "Ruta 02",
    colonia: "Las Palmas",
    dias: ["Martes", "Jueves"],
    turno: "Vespertino",
    estado: "Activo",
    fechaRegistro: "2026-02-02",
  },
  {
    id: 3,
    ruta: "Ruta 03",
    colonia: "San Pedro",
    dias: ["Sábado"],
    turno: "Matutino",
    estado: "Inactivo",
    fechaRegistro: "2026-02-03",
  },
];

export default function DiasRecoleccionPage() {
  const [configs, setConfigs] = useState(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<"Todos" | "Activo" | "Inactivo">("Todos");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiaRecoleccionConfig | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return configs.filter((c) => {
      const matchSearch =
        c.ruta.toLowerCase().includes(q) ||
        c.colonia.toLowerCase().includes(q);

      const matchEstado =
        filtroEstado === "Todos" ? true : c.estado === filtroEstado;

      return matchSearch && matchEstado;
    });
  }, [configs, search, filtroEstado]);

  const resumen = useMemo(() => {
    const total = configs.length;
    const activos = configs.filter((c) => c.estado === "Activo").length;
    const inactivos = configs.filter((c) => c.estado === "Inactivo").length;
    return { total, activos, inactivos };
  }, [configs]);

  const handleSave = (
    data: Omit<DiaRecoleccionConfig, "id" | "fechaRegistro">
  ) => {
    if (editing) {
      setConfigs((prev) =>
        prev.map((c) =>
          c.id === editing.id ? { ...c, ...data } : c
        )
      );
    } else {
      const nextId = Math.max(0, ...configs.map((c) => c.id)) + 1;
      setConfigs((prev) => [
        {
          id: nextId,
          fechaRegistro: new Date().toISOString().slice(0, 10),
          ...data,
        },
        ...prev,
      ]);
    }

    setIsModalOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar configuración?")) return;
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="dr-page">
      <div className="dias">
        {/* HEADER */}
        <div className="dias dr-header">
          <div>
            <h1>Días de Recolección</h1>
            <p className="dias subtitle">Configuración de rutas y días asignados</p>
          </div>

          <div className="dias dr-cards">
            <div className="dias dr-card">
              <span>Total</span>
              <strong>{resumen.total}</strong>
            </div>
            <div className="dias dr-card">
              <span>Activos</span>
              <strong>{resumen.activos}</strong>
            </div>
            <div className="dias dr-card">
              <span>Inactivos</span>
              <strong>{resumen.inactivos}</strong>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="dias dr-actions">
          <button className="dias dr-btn-secondary">
            <span>📋</span> Ver Configuraciones
          </button>
          <button
            className="dias dr-btn-primary"
            onClick={() => {
              setEditing(null);
              setIsModalOpen(true);
            }}
          >
            <span>➕</span> Crear Configuración
          </button>
        </div>

        {/* FILTROS */}
        <div className="dias dr-filters">
          <div className="dias dr-chips">
            {["Todos", "Activo", "Inactivo"].map((estado) => (
              <button
                key={estado}
                className={`dias dr-chip ${filtroEstado === estado ? "dias active" : ""}`}
                onClick={() =>
                  setFiltroEstado(
                    estado as "Todos" | "Activo" | "Inactivo"
                  )
                }
              >
                {estado}
              </button>
            ))}
          </div>

          <input
            className="dias dr-search"
            placeholder="Buscar por ruta o colonia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLA - Nota: Este componente deberá ser modificado para usar las clases con prefijo "dias" */}
        <DiasRecoleccionTable
          data={filtered}
          onEdit={(config) => {
            setEditing(config);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />

        {/* MODAL */}
        {isModalOpen && (
          <div
            className="dias dr-modal-overlay"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="dias dr-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>
                {editing
                  ? "Editar Configuración"
                  : "Nueva Configuración"}
              </h2>

              <DiasRecoleccionForm
                key={editing?.id ?? "new"}
                initialData={editing}
                onCancel={() => setIsModalOpen(false)}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
