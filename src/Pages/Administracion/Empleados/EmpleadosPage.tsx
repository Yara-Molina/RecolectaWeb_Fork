import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiPlus, FiUsers, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import EmpleadoForm from "./components/EmpleadoForm";
import EmpleadosTable from "./components/EmpleadosTable";
import AsignarCamionModal, { type CamionOption } from "./components/AsignarCamionModal";
import "./EmpleadosPage.css";
import { apiRequest } from "../../../services/api";
import { ROLE_NAMES, type RoleId } from "../../../services/auth";

export interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  username: string;
  created_at: string;
  rolId: number;
}

const ITEMS_POR_PAGINA = 10;

export interface EmpleadoFormValues {
  nombre: string;
  apellidos: string;
  mail: string;
  username: string;
  password: string;
  rol_id: RoleId;
}

function normalizarEmpleado(raw: unknown): Empleado {
  const s = raw as Record<string, unknown>;
  return {
    id: Number(s.id ?? 0),
    nombre: typeof s.nombre === "string" ? s.nombre : "",
    apellidos: typeof s.apellidos === "string" ? s.apellidos : "",
    email: typeof s.mail === "string" ? s.mail : "",
    username: typeof s.username === "string" ? s.username : "",
    created_at: typeof s.created_at === "string" ? s.created_at : "",
    rolId: Number(s.rol_id ?? 0),
  };
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "todos">("todos");
  const [modal, setModal] = useState<{ modo: "CREAR" | "EDITAR"; empleado: Empleado | null } | null>(null);
  const [asignacionModal, setAsignacionModal] = useState<Empleado | null>(null);
  const [camiones, setCamiones] = useState<CamionOption[]>([]);
  const [asignacionesActivas, setAsignacionesActivas] = useState<Map<number, number>>(new Map());
  const [saving, setSaving] = useState(false);
  const [pagina, setPagina] = useState(1);

  async function loadCamiones() {
    try {
      const response = await apiRequest<{ data: CamionOption[] }>("/api/camion/");
      setCamiones(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? `No se pudieron cargar los camiones: ${err.message}`
          : "No se pudieron cargar los camiones.",
      );
    }
  }

  async function loadAsignacionesActivas() {
    try {
      const response = await apiRequest<{ data: unknown[] }>("/api/historial-asignacion/");
      const activas = new Map<number, number>();

      for (const raw of response.data ?? []) {
        const row = raw as Record<string, unknown>;
        const idChofer = Number(row.id_chofer ?? 0);
        const idCamion = Number(row.id_camion ?? 0);
        const fechaBaja = typeof row.fecha_baja === "string" ? row.fecha_baja : "";

        if (idChofer > 0 && idCamion > 0 && !fechaBaja) {
          activas.set(idChofer, idCamion);
        }
      }

      setAsignacionesActivas(activas);
    } catch (err) {
      setError(
        err instanceof Error
          ? `No se pudo cargar asignaciones chofer-camión: ${err.message}`
          : "No se pudo cargar asignaciones chofer-camión.",
      );
    }
  }

  async function loadEmpleados() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: unknown[] }>("/api/empleados/");
      setEmpleados(response.data.map(normalizarEmpleado));
      await Promise.all([loadCamiones(), loadAsignacionesActivas()]);
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

    return empleados.filter((e) => {
      if (roleFilter !== "todos" && e.rolId !== roleFilter) return false;
      if (q.length === 0) return true;
      return e.nombre.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
    });
  }, [empleados, search, roleFilter]);

  const totalPaginas = Math.max(1, Math.ceil(filteredEmpleados.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const empleadosPagina = filteredEmpleados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  useEffect(() => {
    setPagina(1);
  }, [search, roleFilter]);

  const openCreate = () => setModal({ modo: "CREAR", empleado: null });
  const openEdit = (empleado: Empleado) => setModal({ modo: "EDITAR", empleado });
  const closeModal = () => setModal(null);
  const openAsignarCamion = (empleado: Empleado) => setAsignacionModal(empleado);
  const closeAsignacionModal = () => setAsignacionModal(null);

  const camionPorConductor = useMemo(() => {
    const map = new Map<number, string>();
    for (const [choferId, camionId] of asignacionesActivas) {
      const camion = camiones.find((c) => c.camion_id === camionId);
      map.set(choferId, camion?.placa ?? `Camión #${camionId}`);
    }
    return map;
  }, [asignacionesActivas, camiones]);

  const handleAsignarCamion = async (empleadoId: number, camionId: number) => {
    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/historial-asignacion/cerrar/chofer/${empleadoId}`, {
        method: "PUT",
      }).catch(() => undefined);

      await apiRequest(`/api/historial-asignacion/cerrar/camion/${camionId}`, {
        method: "PUT",
      }).catch(() => undefined);

      await apiRequest("/api/historial-asignacion/", {
        method: "POST",
        body: JSON.stringify({
          id_chofer: empleadoId,
          id_camion: camionId,
          fecha_asignacion: new Date().toISOString().slice(0, 10),
        }),
      });

      closeAsignacionModal();
      await loadAsignacionesActivas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar el camión.");
    } finally {
      setSaving(false);
    }
  };

  const handleDesasignarCamion = async (empleadoId: number) => {
    const ok = confirm("¿Quitar la asignación de camión de este conductor?");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/historial-asignacion/cerrar/chofer/${empleadoId}`, {
        method: "PUT",
      });
      closeAsignacionModal();
      await loadAsignacionesActivas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar la asignación.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (values: EmpleadoFormValues) => {
    if (!modal) return;

    setSaving(true);
    setError(null);

    try {
      if (modal.modo === "CREAR") {
        await apiRequest("/api/empleados/", {
          method: "POST",
          body: JSON.stringify(values),
        });
      } else {
        // password vacío = no cambiarla; el backend acepta updates parciales.
        const { password, ...rest } = values;
        const payload = password ? values : rest;

        await apiRequest(`/api/empleados/${modal.empleado!.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      }

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
    const headers = ["ID", "Nombre", "Email", "Rol", "Fecha Registro"];
    const rows = filteredEmpleados.map((e) => [
      e.id,
      e.nombre,
      e.email,
      ROLE_NAMES[e.rolId as RoleId] ?? "—",
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
                <FiUsers />
              </div>
              <div>
                <h3>{empleados.length}</h3>
                <span>Total</span>
              </div>
            </div>
          </div>
        </section>

        <section className="emp-toolbar">
          <input
            className="emp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />

          <select
            className="emp-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value === "todos" ? "todos" : (Number(e.target.value) as RoleId))}
          >
            <option value="todos">Todos los roles</option>
            {(Object.entries(ROLE_NAMES) as [string, string][]).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>

          <div className="emp-toolbar-actions">
            <button className="emp-btn secondary" onClick={handleExport}>
              <FiDownload /> Exportar
            </button>

            <button className="emp-btn primary" onClick={openCreate} disabled={saving}>
              <FiPlus /> Nuevo empleado
            </button>
          </div>
        </section>

        {error && <div className="emp-alert">{error}</div>}

        {loading ? (
          <div className="emp-loading">Cargando empleados...</div>
        ) : (
          <>
            <EmpleadosTable
              data={empleadosPagina}
              camionPorConductor={camionPorConductor}
              onDelete={handleDelete}
              onEdit={openEdit}
              onAsignarCamion={openAsignarCamion}
            />

            {totalPaginas > 1 && (
              <div className="emp-pagination">
                <button
                  type="button"
                  className="emp-pagination-btn"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  <FiChevronLeft />
                  <span>Anterior</span>
                </button>

                <span className="emp-pagination-info">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="emp-pagination-btn"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                >
                  <span>Siguiente</span>
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {modal && (
          <div className="emp-modal-overlay" onClick={closeModal}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{modal.modo === "CREAR" ? "Nuevo empleado" : "Editar empleado"}</h2>

              <EmpleadoForm
                modo={modal.modo}
                empleado={modal.empleado}
                onCancel={closeModal}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        )}

        {asignacionModal && (
          <div className="emp-modal-overlay" onClick={closeAsignacionModal}>
            <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Asignar camión</h2>
              <AsignarCamionModal
                empleado={asignacionModal}
                camiones={camiones}
                camionActualId={asignacionesActivas.get(asignacionModal.id) ?? null}
                saving={saving}
                onCancel={closeAsignacionModal}
                onSave={(camionId) => void handleAsignarCamion(asignacionModal.id, camionId)}
                onDesasignar={() => void handleDesasignarCamion(asignacionModal.id)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
