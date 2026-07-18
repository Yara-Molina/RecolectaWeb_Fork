import { useEffect, useMemo, useState } from "react";
import { FaDownload, FaPlus, FaUsers } from "react-icons/fa";
import EmpleadoForm from "./components/EmpleadoForm";
import EmpleadosTable from "./components/EmpleadosTable";
import "./EmpleadosPage.css";
import { apiRequest } from "../../../services/api";

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  alias: string | null;
  telefono: string | null;
  created_at: string;
}

export interface EmpleadoCreatePayload {
  nombre: string;
  apellidos: string;
  mail: string;
  username: string;
  password: string;
  rol_id: 4;
}

function normalizarEmpleado(raw: unknown): Empleado {
  const s = raw as Record<string, unknown>;
  return {
    id: Number(s.id ?? 0),
    nombre: typeof s.nombre === "string" ? s.nombre : "",
    email: typeof s.mail === "string" ? s.mail : "",
    alias: typeof s.alias === "string" ? s.alias : null,
    telefono: typeof s.telefono === "string" ? s.telefono : null,
    created_at: typeof s.created_at === "string" ? s.created_at : "",
  };
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadEmpleados() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: unknown[] }>("/api/empleados/");
      const soloEmpleados = response.data.filter(
        (u) => (u as Record<string, unknown>).rol_id === 4
      );
      setEmpleados(soloEmpleados.map(normalizarEmpleado));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los empleados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmpleados();
  }, []);

  const filteredEmpleados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return empleados;

    return empleados.filter((e) =>
      e.nombre.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  }, [empleados, search]);

  const openCreate = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (payload: EmpleadoCreatePayload) => {
    setSaving(true);
    setError(null);

    try {
      await apiRequest("/api/empleados/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      closeModal();
      await loadEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const empleado = empleados.find((e) => e.id === id);
    if (!empleado) return;

    const ok = confirm(`¿Eliminar al empleado ${empleado.nombre}?`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/empleados/${id}`, { method: "DELETE" });
      await loadEmpleados();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el empleado.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Nombre", "Email", "Fecha Registro"];
    const rows = filteredEmpleados.map((e) => [
      e.id,
      e.nombre,
      e.email,
      e.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `empleados_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="emp-page">
      <div className="emp-shell">
        <section className="emp-header">
          <div>
            <h1>Empleados</h1>
            <p>Administración y control de personal registrado en el sistema.</p>
          </div>

          <div className="emp-cards">
            <div className="emp-card">
              <div className="emp-card-icon">
                <FaUsers />
              </div>
              <div>
                <h3>{empleados.length}</h3>
                <span>Total</span>
              </div>
            </div>
          </div>
        </section>

        <section className="emp-actions">
          <button className="emp-btn secondary" onClick={handleExport}>
            <FaDownload /> Exportar
          </button>

          <button className="emp-btn primary" onClick={openCreate} disabled={saving}>
            <FaPlus /> Nuevo empleado
          </button>
        </section>

        <section className="emp-toolbar">
          <input
            className="emp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />
        </section>

        {error && <div className="emp-alert">{error}</div>}

        {loading ? (
          <div className="emp-loading">Cargando empleados...</div>
        ) : (
          <EmpleadosTable data={filteredEmpleados} onDelete={handleDelete} />
        )}

        {isModalOpen && (
          <div className="emp-modal-overlay" onClick={closeModal}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Nuevo empleado</h2>

              <EmpleadoForm
                onCancel={closeModal}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
