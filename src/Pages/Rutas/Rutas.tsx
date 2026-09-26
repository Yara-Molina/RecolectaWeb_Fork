import { useEffect, useState } from "react";
import { FiTrash2, FiEdit2, FiPower } from "react-icons/fi";
import { apiRequest } from "../../services/api";
import {
  confirmar,
  confirmarEliminacion,
  alertaError,
} from "../../util/alertas";
import CrearRutaMapa, { type RutaEnEdicion } from "./CrearRutaMapa";
import "./Rutas.css";

interface RutaItem {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  conductor_id: number | null;
  activa?: boolean | number;
  json_ruta: string | { puntos?: unknown[] } | null;
  dias_recoleccion?: string[] | null;
  frecuencia_semanal?: number | null;
  turno?: string | null;
  created_at: string;
}

const ABREVIATURA_DIA: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mie",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sab",
  domingo: "Dom",
};

function resumenProgramacion(ruta: RutaItem): string | null {
  const partes: string[] = [];

  const dias = ruta.dias_recoleccion ?? [];
  if (dias.length > 0) {
    partes.push(dias.map((d) => ABREVIATURA_DIA[d] ?? d).join(", "));
  }
  if (ruta.frecuencia_semanal) {
    partes.push(`${ruta.frecuencia_semanal}x por semana`);
  }
  if (ruta.turno) {
    partes.push(ruta.turno);
  }

  return partes.length > 0 ? partes.join(" · ") : null;
}

export default function Rutas() {
  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [rutaEnEdicion, setRutaEnEdicion] = useState<RutaEnEdicion | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const cargarRutas = async () => {
    setLoading(true);
    try {
      const json = await apiRequest<RutaItem[] | { data: RutaItem[] }>(
        "/api/rutas/",
      );
      if (Array.isArray(json)) {
        setRutas(json);
      } else if (Array.isArray(json.data)) {
        setRutas(json.data);
      }
    } catch (err) {
      console.error("Error cargando rutas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  const esActiva = (ruta: RutaItem) =>
    ruta.activa === true || ruta.activa === 1;

  const desactivarRuta = async (ruta: RutaItem) => {
    const ok = await confirmar(
      `¿Desactivar "${ruta.nombre}"?`,
      "El conductor dejara de verla en la app. Podras asignarle otra ruta despues.",
      "Desactivar",
    );
    if (!ok) return;
    try {
      await apiRequest(`/api/rutas/${ruta.ruta_id}`, {
        method: "PUT",
        body: JSON.stringify({ activa: false }),
      });
      await cargarRutas();
    } catch (err) {
      console.error("Error desactivando ruta:", err);
      alertaError(
        "No se pudo desactivar la ruta",
        "Intentalo de nuevo en unos segundos.",
      );
    }
  };

  const editarPuntos = async (ruta: RutaItem) => {
    try {
      const res = await apiRequest<{
        success: boolean;
        data: Array<{
          lat: number;
          lon: number;
          nombre?: string;
          direccion?: string;
          cp?: string | null;
          es_inicio?: boolean | number;
          es_esquina?: boolean | number;
        }>;
      }>(`/api/puntos-recoleccion/ruta/${ruta.ruta_id}`);
      const puntos = (res.data ?? [])
        .filter((p) => !(p.es_inicio === true || p.es_inicio === 1))
        .filter((p) => !(p.es_esquina === true || p.es_esquina === 1))
        .map((p) => ({
          lat: p.lat,
          lng: p.lon,
          nombre: p.nombre,
          direccion: p.direccion,
          cp: p.cp,
        }));

      setRutaEnEdicion({
        ruta_id: ruta.ruta_id,
        nombre: ruta.nombre,
        conductor_id: ruta.conductor_id,
        dias_recoleccion: ruta.dias_recoleccion ?? null,
        frecuencia_semanal: ruta.frecuencia_semanal ?? null,
        turno: ruta.turno ?? null,
        puntos,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error cargando puntos de la ruta:", err);
      alertaError(
        "No se pudieron cargar los puntos",
        "Intentalo de nuevo en unos segundos.",
      );
    }
  };

  const eliminarRuta = async (id: number) => {
    const ok = await confirmarEliminacion(
      "¿Eliminar esta ruta?",
      "Se borrarán también sus puntos de recolección. Esta acción no se puede deshacer.",
    );
    if (!ok) return;
    try {
      await apiRequest(`/api/rutas/${id}`, { method: "DELETE" });
      setRutas((prev) => prev.filter((r) => r.ruta_id !== id));
    } catch (err) {
      console.error("Error eliminando ruta:", err);
    }
  };

  const contarPuntos = (ruta: RutaItem): number => {
    try {
      const json =
        typeof ruta.json_ruta === "string"
          ? JSON.parse(ruta.json_ruta)
          : ruta.json_ruta;
      if (Array.isArray(json?.puntos)) return json.puntos.length;
      if (Array.isArray(json)) return json.length;
      return 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="rutas-page">
      <div className="rutas-container">
        <header className="rutas-header">
          <h1>Rutas</h1>
          <p>Crea rutas sobre el mapa y consulta las existentes</p>
        </header>

        <CrearRutaMapa
          onRutaCreada={() => {
            setRutaEnEdicion(null);
            cargarRutas();
          }}
          rutaEnEdicion={rutaEnEdicion}
          onCancelarEdicion={() => setRutaEnEdicion(null)}
        />

        <section className="rutas-panel">
          <header className="rutas-panel-head">
            <h2>Rutas creadas</h2>
            {!loading && rutas.length > 0 && (
              <span className="rutas-panel-contador">
                {rutas.length} ruta{rutas.length === 1 ? "" : "s"}
              </span>
            )}
          </header>

          <div className="rutas-list">
            {loading && <p className="rutas-empty">Cargando rutas...</p>}
            {!loading && rutas.length === 0 && (
              <p className="rutas-empty">No hay rutas creadas aún.</p>
            )}
            {rutas.map((ruta) => (
              <div key={ruta.ruta_id} className="ruta-item">
                <div className="ruta-item-left">
                  <span className="ruta-nombre">{ruta.nombre}</span>
                  {ruta.descripcion && (
                    <span className="ruta-desc">{ruta.descripcion}</span>
                  )}
                  {resumenProgramacion(ruta) ? (
                    <span className="ruta-programacion">
                      {resumenProgramacion(ruta)}
                    </span>
                  ) : (
                    <span className="ruta-programacion ruta-programacion--falta">
                      Falta programacion: dias y frecuencia
                    </span>
                  )}
                </div>
                <div className="ruta-item-right">
                  <span
                    className={`ruta-estado ${esActiva(ruta) ? "ruta-estado--activa" : ""}`}
                  >
                    {esActiva(ruta) ? "Activa" : "Inactiva"}
                  </span>
                  <span className="ruta-puntos">
                    {contarPuntos(ruta)} puntos
                  </span>
                  <button
                    className="ruta-btn"
                    onClick={() => editarPuntos(ruta)}
                    aria-label={`Editar puntos de ${ruta.nombre}`}
                    title="Editar puntos"
                  >
                    <FiEdit2 />
                  </button>
                  {esActiva(ruta) && (
                    <button
                      className="ruta-btn"
                      onClick={() => desactivarRuta(ruta)}
                      aria-label={`Desactivar ${ruta.nombre}`}
                      title="Desactivar ruta"
                    >
                      <FiPower />
                    </button>
                  )}
                  <button
                    className="ruta-btn ruta-btn-eliminar"
                    onClick={() => eliminarRuta(ruta.ruta_id)}
                    aria-label={`Eliminar ${ruta.nombre}`}
                    title="Eliminar ruta"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
