// src/Pages/Administracion/Camiones/CamionesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { FaTruck, FaCheckCircle, FaPlus, FaList, FaFileExport } from "react-icons/fa";
import CamionesTable from "./components/CamionesTable";
import CamionForm from "./components/CamionForm";
import { apiRequest } from "../../../services/api";
import "./CamionesPage.css";

export interface TipoCamion {
  tipo_camion_id: number;
  nombre: string;
  descripcion: string;
  created_at: string;
}

export interface Camion {
  camion_id: number;
  placa: string;
  modelo: string;
  tipo_camion_id: number;
  es_rentado: boolean;
  disponibilidad_id: number;
  nombre_disponibilidad: string;
  color_disponibilidad: string;
  created_at: string;
  updated_at: string;
}

// El backend (CreateCamionRequest/UpdateCamionRequest en camion_swagger.go) solo
// acepta estos 5 campos. nombre_disponibilidad y color_disponibilidad NO se envían:
// el backend los deriva siempre de disponibilidad_id (ver mapEstadoToDisponibilidad
// en PostgresCamion.go), así que mandarlos no tendría ningún efecto.
export interface CamionPayload {
  placa: string;
  modelo: string;
  tipo_camion_id: number;
  es_rentado: boolean;
  disponibilidad_id: number;
}

// Estados fijos que maneja el backend para disponibilidad_id (mapEstadoToDisponibilidad
// en src/Rutas/infraestructure/adapters/PostgresCamion.go). No es un catálogo con
// endpoint propio: son estos 4 valores, siempre.
export const ESTADOS_DISPONIBILIDAD = [
  { id: 1, nombre: "OPERATIVO", label: "Operativo", color: "#2e7d32" },
  { id: 2, nombre: "MANTENIMIENTO", label: "Mantenimiento", color: "#e88d1d" },
  { id: 3, nombre: "FUERA_SERVICIO", label: "Fuera de servicio", color: "#e24b4a" },
  { id: 4, nombre: "BAJA", label: "Baja", color: "#757575" },
] as const;

export default function CamionesPage() {
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [tiposCamion, setTiposCamion] = useState<TipoCamion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("TODOS");
  const [soloRentados, setSoloRentados] = useState(false);

  // Modal / Form
  const [modalOpen, setModalOpen] = useState(false);
  const [modoForm, setModoForm] = useState<"CREAR" | "EDITAR">("CREAR");
  const [camionSeleccionado, setCamionSeleccionado] = useState<Camion | null>(null);

  async function loadCamiones() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: Camion[] }>("/api/camion/");
      setCamiones(response.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los camiones.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTiposCamion() {
    try {
      const response = await apiRequest<{ data: TipoCamion[] }>("/api/tipo-camion/");
      setTiposCamion(response.data ?? []);
    } catch {
      // El catálogo de tipos es secundario: si falla, el formulario simplemente lo mostrará vacío.
    }
  }

  useEffect(() => {
    void loadCamiones();
    void loadTiposCamion();
  }, []);

  const estadosDisponibles = useMemo(() => {
    const nombres = camiones
      .map((c) => c.nombre_disponibilidad)
      .filter((n): n is string => Boolean(n));
    return Array.from(new Set(nombres));
  }, [camiones]);

  const camionesFiltrados = useMemo(() => {
    return camiones
      .filter((c) => {
        if (estadoFiltro === "TODOS") return true;
        return c.nombre_disponibilidad === estadoFiltro;
      })
      .filter((c) => {
        if (!soloRentados) return true;
        return c.es_rentado;
      })
      .filter((c) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        const tipoNombre = tiposCamion.find((t) => t.tipo_camion_id === c.tipo_camion_id)?.nombre ?? "";

        return (
          c.placa.toLowerCase().includes(q) ||
          c.modelo.toLowerCase().includes(q) ||
          tipoNombre.toLowerCase().includes(q)
        );
      });
  }, [camiones, estadoFiltro, soloRentados, search, tiposCamion]);

  const resumen = useMemo(() => {
    const total = camiones.length;
    const rentados = camiones.filter((c) => c.es_rentado).length;
    return { total, rentados };
  }, [camiones]);

  function abrirCrear() {
    setModoForm("CREAR");
    setCamionSeleccionado(null);
    setModalOpen(true);
  }

  function abrirEditar(camion: Camion) {
    setModoForm("EDITAR");
    setCamionSeleccionado(camion);
    setModalOpen(true);
  }

  function cerrarModal() {
    setModalOpen(false);
  }

  async function eliminarCamion(camion_id: number) {
    const ok = confirm("¿Seguro que deseas eliminar este camión?");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/camion/${camion_id}`, { method: "DELETE" });
      await loadCamiones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el camión.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmitForm(data: CamionPayload) {
    setSaving(true);
    setError(null);

    try {
      if (modoForm === "CREAR") {
        await apiRequest("/api/camion/", {
          method: "POST",
          body: JSON.stringify(data),
        });
      } else if (camionSeleccionado) {
        await apiRequest(`/api/camion/${camionSeleccionado.camion_id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
      }

      setModalOpen(false);
      await loadCamiones();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el camión.");
    } finally {
      setSaving(false);
    }
  }

  function exportarCSV() {
    const headers = ["placa", "modelo", "tipo", "rentado", "disponibilidad"];
    const rows = camionesFiltrados.map((c) => [
      c.placa,
      c.modelo,
      tiposCamion.find((t) => t.tipo_camion_id === c.tipo_camion_id)?.nombre ?? "",
      c.es_rentado ? "SI" : "NO",
      c.nombre_disponibilidad,
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "camiones.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-page">
      <div className="camiones">
        <section className="camiones admin-header">
          <div className="camiones admin-header-left">
            <h1>Camiones</h1>
            <p>Administración general de unidades registradas.</p>
          </div>

          <div className="camiones admin-header-cards">
            <div className="camiones mini-card">
              <div className="camiones mini-card-icon">
                <FaTruck />
              </div>
              <div>
                <h3 className="camiones mini-card-value">{resumen.total}</h3>
                <span className="camiones mini-card-label">Camiones totales</span>
              </div>
            </div>

            <div className="camiones mini-card">
              <div className="camiones mini-card-icon ok">
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="camiones mini-card-value">{resumen.rentados}</h3>
                <span className="camiones mini-card-label">Rentados</span>
              </div>
            </div>
          </div>
        </section>

        <section className="camiones admin-actions-bar">
          <button className="camiones btn camiones btn-light" onClick={() => void loadCamiones()}>
            <FaList />
            Ver Camiones
          </button>

          <button className="camiones btn camiones btn-primary" onClick={abrirCrear} disabled={saving}>
            <FaPlus />
            Crear Camión
          </button>
        </section>

        <section className="camiones admin-filters">
          <div className="camiones filters-left">
            <div className="camiones chip-group">
              <button
                className={`camiones chip ${estadoFiltro === "TODOS" ? "camiones active" : ""}`}
                onClick={() => setEstadoFiltro("TODOS")}
              >
                Todos
              </button>

              {estadosDisponibles.map((nombre) => (
                <button
                  key={nombre}
                  className={`camiones chip ${estadoFiltro === nombre ? "camiones active" : ""}`}
                  onClick={() => setEstadoFiltro(nombre)}
                >
                  {nombre}
                </button>
              ))}
            </div>

            <label className="camiones checkbox">
              <input
                type="checkbox"
                checked={soloRentados}
                onChange={(e) => setSoloRentados(e.target.checked)}
              />
              Solo rentados
            </label>
          </div>

          <div className="camiones filters-right">
            <input
              className="camiones search"
              placeholder="Buscar por placa, modelo o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button className="camiones btn camiones btn-outline" onClick={exportarCSV}>
              <FaFileExport />
              Exportar
            </button>
          </div>
        </section>

        {error && <div className="camiones form-error">{error}</div>}

        <section className="camiones admin-table-section">
          <div className="camiones admin-table-top">
            <span>Mostrando {camionesFiltrados.length} camiones</span>
            <span className="camiones muted">
              Actualizado: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </span>
          </div>

          {loading ? (
            <div className="camiones empty-state">Cargando camiones...</div>
          ) : (
            <CamionesTable
              camiones={camionesFiltrados}
              tiposCamion={tiposCamion}
              onEditar={abrirEditar}
              onEliminar={eliminarCamion}
            />
          )}
        </section>

        {modalOpen && (
          <div className="camiones modal-overlay" onMouseDown={cerrarModal}>
            <div className="camiones modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="camiones modal-header">
                <h2>{modoForm === "CREAR" ? "Crear Camión" : "Editar Camión"}</h2>
                <button className="camiones modal-close" onClick={cerrarModal}>
                  ✕
                </button>
              </div>

              <CamionForm
                key={camionSeleccionado?.camion_id ?? "new"}
                modo={modoForm}
                tiposCamion={tiposCamion}
                camion={camionSeleccionado}
                saving={saving}
                onCancel={cerrarModal}
                onSubmit={onSubmitForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
