import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiSmartphone,
} from "react-icons/fi";
import DispositivosTable from "./components/DispositivosTable";
import "./DispositivosPage.css";
import { apiRequest, ApiError } from "../../../services/api";

export type DispositivoVista = "pendientes" | "vinculados";

export interface DispositivoItem {
  id: number;
  conductor_id: number;
  conductor_nombre: string;
  conductor_apellido: string;
  conductor_mail: string;
  mac_address: string;
  serial_number: string;
  api_key: string;
  nombre_dispositivo: string;
  active: boolean;
  created_at: string;
}

/** @deprecated Prefer DispositivoItem */
export type DispositivoPendiente = DispositivoItem;

const ITEMS_POR_PAGINA = 10;

function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (err.status === 403) return "No tienes permisos para realizar esta acción.";
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

function normalizarDispositivo(raw: unknown): DispositivoItem {
  const s = raw as Record<string, unknown>;
  return {
    id: Number(s.id ?? 0),
    conductor_id: Number(s.conductor_id ?? 0),
    conductor_nombre: typeof s.conductor_nombre === "string" ? s.conductor_nombre : "",
    conductor_apellido: typeof s.conductor_apellido === "string" ? s.conductor_apellido : "",
    conductor_mail: typeof s.conductor_mail === "string" ? s.conductor_mail : "",
    mac_address: typeof s.mac_address === "string" ? s.mac_address : "",
    serial_number: typeof s.serial_number === "string" ? s.serial_number : "",
    api_key: typeof s.api_key === "string" ? s.api_key : "",
    nombre_dispositivo: typeof s.nombre_dispositivo === "string" ? s.nombre_dispositivo : "",
    active: Boolean(s.active),
    created_at: typeof s.created_at === "string" ? s.created_at : "",
  };
}

export default function DispositivosPage() {
  const [vista, setVista] = useState<DispositivoVista>("pendientes");
  const [pendientes, setPendientes] = useState<DispositivoItem[]>([]);
  const [vinculados, setVinculados] = useState<DispositivoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagina, setPagina] = useState(1);
  const [actingId, setActingId] = useState<number | null>(null);

  const loadListas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [respPendientes, respActivos] = await Promise.all([
        apiRequest<{ data: unknown[] }>("/api/dispositivos/pendientes"),
        apiRequest<{ data: unknown[] }>("/api/dispositivos/activos"),
      ]);
      setPendientes((respPendientes.data ?? []).map(normalizarDispositivo));
      setVinculados((respActivos.data ?? []).map(normalizarDispositivo));
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar los dispositivos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListas();
  }, [loadListas]);

  const dispositivos = vista === "pendientes" ? pendientes : vinculados;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dispositivos;

    return dispositivos.filter((d) => {
      const nombre = `${d.conductor_nombre} ${d.conductor_apellido}`.toLowerCase();
      return (
        nombre.includes(q) ||
        d.conductor_mail.toLowerCase().includes(q) ||
        d.mac_address.toLowerCase().includes(q) ||
        d.serial_number.toLowerCase().includes(q) ||
        d.nombre_dispositivo.toLowerCase().includes(q) ||
        String(d.conductor_id).includes(q)
      );
    });
  }, [dispositivos, search]);

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginaItems = filtered.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  useEffect(() => {
    setPagina(1);
  }, [search, vista]);

  const handleAprobar = async (dispositivo: DispositivoItem) => {
    const nombre = `${dispositivo.conductor_nombre} ${dispositivo.conductor_apellido}`.trim();
    const ok = confirm(
      `¿Aprobar el dispositivo de ${nombre || `conductor #${dispositivo.conductor_id}`}?\n\n` +
        `MAC: ${dispositivo.mac_address}\nSerie: ${dispositivo.serial_number}`,
    );
    if (!ok) return;

    setActingId(dispositivo.conductor_id);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/api/dispositivos/aprobar/${dispositivo.conductor_id}`, {
        method: "PUT",
      });
      setSuccess("Dispositivo aprobado y activado correctamente.");
      await loadListas();
    } catch (err) {
      setError(mensajeError(err, "No se pudo aprobar el dispositivo."));
    } finally {
      setActingId(null);
    }
  };

  const handleDesvincular = async (dispositivo: DispositivoItem) => {
    const nombre = `${dispositivo.conductor_nombre} ${dispositivo.conductor_apellido}`.trim();
    const ok = confirm(
      `¿Desvincular el dispositivo de ${nombre || `conductor #${dispositivo.conductor_id}`}?\n\n` +
        "El conductor podrá solicitar otra vinculación después. Útil si el equipo se perdió o fue robado.",
    );
    if (!ok) return;

    setActingId(dispositivo.conductor_id);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/api/dispositivos/desvincular/${dispositivo.conductor_id}`, {
        method: "DELETE",
      });
      setSuccess("Dispositivo desvinculado correctamente.");
      await loadListas();
    } catch (err) {
      setError(mensajeError(err, "No se pudo desvincular el dispositivo."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="disp-page">
      <div className="disp-shell">
        <section className="disp-header">
          <div>
            <h1>Dispositivos</h1>
            <p>
              Revisa solicitudes de vinculación, aprueba equipos o desvincula
              dispositivos autorizados (pérdida o robo).
            </p>
          </div>

          <div className="disp-cards">
            <button
              type="button"
              className={`disp-card${vista === "pendientes" ? " active" : ""}`}
              onClick={() => setVista("pendientes")}
            >
              <div className="disp-card-icon">
                <FiSmartphone />
              </div>
              <div>
                <h3>{pendientes.length}</h3>
                <span>Pendientes</span>
              </div>
            </button>
            <button
              type="button"
              className={`disp-card${vista === "vinculados" ? " active" : ""}`}
              onClick={() => setVista("vinculados")}
            >
              <div className="disp-card-icon">
                <FiCheckCircle />
              </div>
              <div>
                <h3>{vinculados.length}</h3>
                <span>Vinculados</span>
              </div>
            </button>
          </div>
        </section>

        <section className="disp-tabs" aria-label="Vista de dispositivos">
          <button
            type="button"
            className={`disp-tab${vista === "pendientes" ? " active" : ""}`}
            onClick={() => setVista("pendientes")}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={`disp-tab${vista === "vinculados" ? " active" : ""}`}
            onClick={() => setVista("vinculados")}
          >
            Vinculados
          </button>
        </section>

        <section className="disp-toolbar">
          <input
            className="disp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por conductor, ID, MAC, serie o dispositivo..."
          />

          <div className="disp-toolbar-actions">
            <button
              type="button"
              className="disp-btn secondary"
              onClick={() => void loadListas()}
              disabled={loading || actingId !== null}
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>
        </section>

        {error && <div className="disp-alert">{error}</div>}
        {success && <div className="disp-success">{success}</div>}

        {loading ? (
          <div className="disp-loading">Cargando dispositivos...</div>
        ) : (
          <>
            <DispositivosTable
              data={paginaItems}
              vista={vista}
              actingId={actingId}
              onAprobar={handleAprobar}
              onDesvincular={handleDesvincular}
            />

            {totalPaginas > 1 && (
              <div className="disp-pagination">
                <button
                  type="button"
                  className="disp-pagination-btn"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                >
                  <FiChevronLeft />
                  <span>Anterior</span>
                </button>

                <span className="disp-pagination-info">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="disp-pagination-btn"
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
      </div>
    </div>
  );
}
