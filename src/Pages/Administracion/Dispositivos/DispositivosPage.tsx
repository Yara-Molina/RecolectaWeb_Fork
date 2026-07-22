import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLink,
  FiRefreshCw,
  FiSmartphone,
} from "react-icons/fi";
import DispositivosTable from "./components/DispositivosTable";
import "./DispositivosPage.css";
import { apiRequest, ApiError } from "../../../services/api";

export interface DispositivoPendiente {
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

const ITEMS_POR_PAGINA = 10;

function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (err.status === 403) return "No tienes permisos para realizar esta acción.";
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

function normalizarDispositivo(raw: unknown): DispositivoPendiente {
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
  const [dispositivos, setDispositivos] = useState<DispositivoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pagina, setPagina] = useState(1);
  const [actingId, setActingId] = useState<number | null>(null);
  const [desvincularId, setDesvincularId] = useState("");
  const [desvinculandoManual, setDesvinculandoManual] = useState(false);

  async function loadPendientes() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: unknown[] }>("/api/dispositivos/pendientes");
      setDispositivos((response.data ?? []).map(normalizarDispositivo));
    } catch (err) {
      setError(mensajeError(err, "No se pudieron cargar las solicitudes de vinculación."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPendientes();
  }, []);

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
  }, [search]);

  const handleAprobar = async (dispositivo: DispositivoPendiente) => {
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
      await loadPendientes();
    } catch (err) {
      setError(mensajeError(err, "No se pudo aprobar el dispositivo."));
    } finally {
      setActingId(null);
    }
  };

  const handleDesvincular = async (dispositivo: DispositivoPendiente) => {
    const nombre = `${dispositivo.conductor_nombre} ${dispositivo.conductor_apellido}`.trim();
    const ok = confirm(
      `¿Desvincular el dispositivo de ${nombre || `conductor #${dispositivo.conductor_id}`}?\n\n` +
        "El conductor podrá solicitar otra vinculación después.",
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
      await loadPendientes();
    } catch (err) {
      setError(mensajeError(err, "No se pudo desvincular el dispositivo."));
    } finally {
      setActingId(null);
    }
  };

  const handleDesvincularManual = async (event: FormEvent) => {
    event.preventDefault();
    const conductorId = Number(desvincularId.trim());
    if (!Number.isFinite(conductorId) || conductorId <= 0) {
      setError("Ingresa un ID de conductor válido.");
      return;
    }

    const ok = confirm(
      `¿Desvincular el dispositivo del conductor #${conductorId}?\n\n` +
        "Útil para dar de baja un equipo ya aprobado que ya no aparece en pendientes.",
    );
    if (!ok) return;

    setDesvinculandoManual(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/api/dispositivos/desvincular/${conductorId}`, {
        method: "DELETE",
      });
      setSuccess(`Dispositivo del conductor #${conductorId} desvinculado correctamente.`);
      setDesvincularId("");
      await loadPendientes();
    } catch (err) {
      setError(mensajeError(err, "No se pudo desvincular el dispositivo."));
    } finally {
      setDesvinculandoManual(false);
    }
  };

  return (
    <div className="disp-page">
      <div className="disp-shell">
        <section className="disp-header">
          <div>
            <h1>Dispositivos</h1>
            <p>
              Revisa solicitudes de vinculación de conductores, aprueba equipos o
              desvincula dispositivos autorizados.
            </p>
          </div>

          <div className="disp-cards">
            <div className="disp-card">
              <div className="disp-card-icon">
                <FiSmartphone />
              </div>
              <div>
                <h3>{dispositivos.length}</h3>
                <span>Pendientes</span>
              </div>
            </div>
          </div>
        </section>

        <section className="disp-toolbar">
          <input
            className="disp-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por conductor, MAC, serie o dispositivo..."
          />

          <div className="disp-toolbar-actions">
            <button
              type="button"
              className="disp-btn secondary"
              onClick={() => void loadPendientes()}
              disabled={loading || actingId !== null}
            >
              <FiRefreshCw /> Actualizar
            </button>
          </div>
        </section>

        <section className="disp-manual">
          <div className="disp-manual-copy">
            <FiLink />
            <div>
              <strong>Desvincular por conductor</strong>
              <p>
                El listado solo muestra solicitudes pendientes. Usa esto para dar de baja
                un dispositivo ya aprobado.
              </p>
            </div>
          </div>

          <form className="disp-manual-form" onSubmit={(e) => void handleDesvincularManual(e)}>
            <input
              className="disp-manual-input"
              value={desvincularId}
              onChange={(e) => setDesvincularId(e.target.value)}
              placeholder="ID del conductor"
              inputMode="numeric"
              disabled={desvinculandoManual}
            />
            <button
              type="submit"
              className="disp-btn danger"
              disabled={desvinculandoManual || !desvincularId.trim()}
            >
              Desvincular
            </button>
          </form>
        </section>

        {error && <div className="disp-alert">{error}</div>}
        {success && <div className="disp-success">{success}</div>}

        {loading ? (
          <div className="disp-loading">Cargando solicitudes...</div>
        ) : (
          <>
            <DispositivosTable
              data={paginaItems}
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
