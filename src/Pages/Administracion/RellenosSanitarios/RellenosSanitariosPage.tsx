// src/Pages/Administracion/RellenosSanitarios/RellenosSanitariosPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RellenosSanitariosPage.css";

import RellenoForm from "./components/RellenoForm";
import RellenosSanitariosTable from "./components/RellenosTable";
import { apiRequest, ApiError } from "../../../services/api";

// Modelo tal como lo devuelve la API (GET /api/relleno-sanitario/)
export interface RellenoSanitario {
  relleno_id: number;
  nombre: string;
  direccion: string;
  es_rentado: boolean;
  eliminado: boolean;
  capacidad_toneladas: number;
}

// Body esperado por POST /api/relleno-sanitario/ y PUT /api/relleno-sanitario/:id
export interface RellenoSanitarioPayload {
  nombre: string;
  direccion: string;
  es_rentado: boolean;
  capacidad_toneladas: number;
}

function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (err.status === 403) return "No tienes permisos para realizar esta acción.";
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function RellenosSanitariosPage() {
  const navigate = useNavigate();

  const [rellenos, setRellenos] = useState<RellenoSanitario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"Todos" | "Rentado" | "Propio">("Todos");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelleno, setEditingRelleno] = useState<RellenoSanitario | null>(null);

  async function loadRellenos() {
    setLoading(true);
    setError(null);

    try {
      // El backend responde el arreglo tal cual (sin envolver en { data: ... }).
      const response = await apiRequest<RellenoSanitario[] | null>("/api/relleno-sanitario/");
      setRellenos(response ?? []);
    } catch (err) {
      const msg = mensajeError(err, "No se pudieron cargar los rellenos sanitarios.");
      setError(msg);
      if (err instanceof ApiError && err.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRellenos();
  }, []);

  // =========================
  // Filtrado
  // =========================
  const filteredRellenos = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rellenos.filter((r) => {
      const matchSearch =
        q.length === 0 ||
        r.nombre.toLowerCase().includes(q) ||
        r.direccion.toLowerCase().includes(q);

      const matchTipo =
        filtroTipo === "Todos"
          ? true
          : filtroTipo === "Rentado"
          ? r.es_rentado
          : !r.es_rentado;

      return matchSearch && matchTipo;
    });
  }, [rellenos, search, filtroTipo]);

  // =========================
  // Cards resumen
  // =========================
  const resumen = useMemo(() => {
    const total = rellenos.length;
    const rentados = rellenos.filter((r) => r.es_rentado).length;
    const propios = total - rentados;

    return { total, rentados, propios };
  }, [rellenos]);

  // =========================
  // CRUD
  // =========================
  const openCreate = () => {
    setEditingRelleno(null);
    setIsModalOpen(true);
  };

  const openEdit = (relleno: RellenoSanitario) => {
    setEditingRelleno(relleno);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingRelleno(null);
  };

  const handleDelete = async (id: number) => {
    const relleno = rellenos.find((r) => r.relleno_id === id);
    if (!relleno) return;

    const ok = confirm(`¿Seguro que deseas eliminar el relleno "${relleno.nombre}"?`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/relleno-sanitario/${id}`, { method: "DELETE" });
      await loadRellenos();
    } catch (err) {
      const msg = mensajeError(err, "No se pudo eliminar el relleno sanitario.");
      setError(msg);
      if (err instanceof ApiError && err.status === 401) navigate("/login");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (data: RellenoSanitarioPayload) => {
    setSaving(true);
    setError(null);

    try {
      if (editingRelleno) {
        await apiRequest(`/api/relleno-sanitario/${editingRelleno.relleno_id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      } else {
        await apiRequest("/api/relleno-sanitario/", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }

      closeModal();
      await loadRellenos();
    } catch (err) {
      const msg = mensajeError(err, "No se pudo guardar el relleno sanitario.");
      setError(msg);
      if (err instanceof ApiError && err.status === 401) navigate("/login");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Nombre", "Dirección", "Capacidad (Ton)", "Rentado"];

    const rows = filteredRellenos.map((r) => [
      r.relleno_id,
      r.nombre,
      r.direccion,
      r.capacidad_toneladas,
      r.es_rentado ? "Sí" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `rellenos_sanitarios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="rs-page">
      {/* =======================
          HEADER
      ======================= */}
      <div className="rs-header">
        <div>
          <h1>Rellenos Sanitarios</h1>
          <p>Administración y seguimiento de rellenos sanitarios registrados</p>
        </div>

        <div className="rs-cards">
          <div className="rs-card">
            <div className="rs-card-title">Rellenos totales</div>
            <div className="rs-card-value">{resumen.total}</div>
          </div>

          <div className="rs-card">
            <div className="rs-card-title">Rentados</div>
            <div className="rs-card-value">{resumen.rentados}</div>
          </div>

          <div className="rs-card">
            <div className="rs-card-title">Propios</div>
            <div className="rs-card-value">{resumen.propios}</div>
          </div>
        </div>
      </div>

      {/* =======================
          BOTONES PRINCIPALES
      ======================= */}
      <div className="rs-actions">
        <button className="rs-btn rs-btn-secondary" onClick={() => void loadRellenos()}>
          📋 Ver Rellenos
        </button>

        <button className="rs-btn rs-btn-primary" onClick={openCreate} disabled={saving}>
          ➕ Crear Relleno
        </button>
      </div>

      {/* =======================
          FILTROS
      ======================= */}
      <div className="rs-filters">
        <div className="rs-filter-left">
          <button
            className={`rs-chip ${filtroTipo === "Todos" ? "active" : ""}`}
            onClick={() => setFiltroTipo("Todos")}
          >
            Todos
          </button>

          <button
            className={`rs-chip ${filtroTipo === "Rentado" ? "active" : ""}`}
            onClick={() => setFiltroTipo("Rentado")}
          >
            Rentados
          </button>

          <button
            className={`rs-chip ${filtroTipo === "Propio" ? "active" : ""}`}
            onClick={() => setFiltroTipo("Propio")}
          >
            Propios
          </button>
        </div>

        <div className="rs-filter-right">
          <input
            className="rs-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o dirección..."
          />

          <button className="rs-btn rs-btn-outline" onClick={handleExport}>
            ⬇ Exportar
          </button>
        </div>
      </div>

      {error && <div className="rs-alert">{error}</div>}

      {/* =======================
          TABLA
      ======================= */}
      <div className="rs-table-container">
        <div className="rs-table-top">
          <span>
            Mostrando <b>{filteredRellenos.length}</b> rellenos sanitarios
          </span>
          <span className="rs-updated">
            Actualizado: Hoy {new Date().toLocaleTimeString().slice(0, 5)}
          </span>
        </div>

        {loading ? (
          <div className="rs-loading">Cargando rellenos sanitarios...</div>
        ) : (
          <RellenosSanitariosTable
            data={filteredRellenos}
            onEdit={openEdit}
            onDelete={handleDelete}
            onDetails={(relleno) => {
              alert(
                `Detalles:\n\nNombre: ${relleno.nombre}\nDirección: ${relleno.direccion}\nCapacidad: ${relleno.capacidad_toneladas} ton\nTipo: ${relleno.es_rentado ? "Rentado" : "Propio"}`
              );
            }}
          />
        )}
      </div>

      {/* =======================
          MODAL FORM
      ======================= */}
      {isModalOpen && (
        <div className="rs-modal-overlay" onClick={closeModal}>
          <div
            className="rs-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rs-modal-header">
              <h2>
                {editingRelleno ? "Editar Relleno" : "Crear Relleno"}
              </h2>
              <button className="rs-modal-close" onClick={closeModal} disabled={saving}>
                ✕
              </button>
            </div>

            <RellenoForm
              key={editingRelleno?.relleno_id ?? "new"}
              initialData={editingRelleno}
              saving={saving}
              onCancel={closeModal}
              onSave={handleSave}
            />
          </div>
        </div>
      )}
    </div>
  );
}
