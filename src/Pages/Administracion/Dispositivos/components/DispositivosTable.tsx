import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { DispositivoItem, DispositivoVista } from "../DispositivosPage";

interface Props {
  data: DispositivoItem[];
  vista: DispositivoVista;
  actingId: number | null;
  onAprobar: (dispositivo: DispositivoItem) => void;
  onDesvincular: (dispositivo: DispositivoItem) => void;
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return "—";
  if (apiKey.length <= 8) return "••••••••";
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

export default function DispositivosTable({
  data,
  vista,
  actingId,
  onAprobar,
  onDesvincular,
}: Props) {
  const esPendientes = vista === "pendientes";

  if (data.length === 0) {
    if (esPendientes) {
      return (
        <div className="disp-empty-state">
          <div className="disp-empty-icon" aria-hidden>
            📱
          </div>
          <h3>No hay solicitudes pendientes</h3>
          <p>
            Cuando un conductor solicite vincular su dispositivo desde la app
            móvil, aparecerá aquí para su aprobación.
          </p>
          <div className="disp-empty-guide">
            <p className="disp-empty-guide-title">Flujo de vinculación:</p>
            <ol>
              <li>El conductor inicia sesión en la app móvil</li>
              <li>La app detecta que el dispositivo no está vinculado</li>
              <li>El conductor toca &quot;Vincular dispositivo&quot;</li>
              <li>La solicitud aparece aquí para aprobar o desvincular</li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <div className="disp-empty-state">
        <div className="disp-empty-icon" aria-hidden>
          ✓
        </div>
        <h3>No hay dispositivos vinculados</h3>
        <p>
          Aquí aparecerán los equipos ya aprobados. Desde esta lista puedes
          desvincularlos si se pierden o son robados.
        </p>
      </div>
    );
  }

  return (
    <div className="disp-table-wrap">
      <table className="disp-table">
        <thead>
          <tr>
            <th>Conductor</th>
            <th>Dispositivo</th>
            <th>Identificadores</th>
            <th>API Key</th>
            <th>{esPendientes ? "Solicitado" : "Vinculado"}</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {data.map((dispositivo) => {
            const nombre =
              `${dispositivo.conductor_nombre} ${dispositivo.conductor_apellido}`.trim() ||
              `Conductor #${dispositivo.conductor_id}`;
            const busy = actingId === dispositivo.conductor_id;

            return (
              <tr key={dispositivo.id || `${dispositivo.conductor_id}-${dispositivo.mac_address}`}>
                <td>
                  <b>{nombre}</b>
                  <div className="disp-subtext">ID: {dispositivo.conductor_id}</div>
                  {dispositivo.conductor_mail && (
                    <div className="disp-subtext">{dispositivo.conductor_mail}</div>
                  )}
                </td>
                <td>
                  <b>{dispositivo.nombre_dispositivo || "Sin nombre"}</b>
                  <div className="disp-subtext">
                    <span className={`disp-badge ${esPendientes ? "pending" : "active"}`}>
                      {esPendientes ? "Pendiente" : "Vinculado"}
                    </span>
                  </div>
                </td>
                <td>
                  <div>
                    <span className="disp-label">MAC</span> {dispositivo.mac_address || "—"}
                  </div>
                  <div className="disp-subtext">
                    <span className="disp-label">Serie</span> {dispositivo.serial_number || "—"}
                  </div>
                </td>
                <td>
                  <code className="disp-api-key" title={dispositivo.api_key}>
                    {maskApiKey(dispositivo.api_key)}
                  </code>
                </td>
                <td>
                  {dispositivo.created_at
                    ? new Date(dispositivo.created_at).toLocaleString("es-MX")
                    : "—"}
                </td>
                <td>
                  <div className="disp-actions-row">
                    {esPendientes && (
                      <button
                        type="button"
                        className="disp-action approve"
                        onClick={() => onAprobar(dispositivo)}
                        disabled={busy || actingId !== null}
                      >
                        <FiCheckCircle />
                        <span>{busy ? "..." : "Aprobar"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="disp-action unlink"
                      onClick={() => onDesvincular(dispositivo)}
                      disabled={busy || actingId !== null}
                    >
                      <FiXCircle />
                      <span>Desvincular</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
