import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import type { DispositivoPendiente } from "../DispositivosPage";

interface Props {
  data: DispositivoPendiente[];
  actingId: number | null;
  onAprobar: (dispositivo: DispositivoPendiente) => void;
  onDesvincular: (dispositivo: DispositivoPendiente) => void;
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return "—";
  if (apiKey.length <= 8) return "••••••••";
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

export default function DispositivosTable({
  data,
  actingId,
  onAprobar,
  onDesvincular,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="disp-empty-state">
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
        <h3>No hay solicitudes pendientes</h3>
        <p>Cuando un conductor solicite vincular su dispositivo desde la app móvil, aparecerá aquí para su aprobación.</p>
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'left', maxWidth: '500px', margin: '24px auto 0' }}>
          <p style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>📋 Flujo de vinculación:</p>
          <ol style={{ fontSize: '14px', paddingLeft: '20px', margin: '0' }}>
            <li>El conductor inicia sesión en la app móvil</li>
            <li>La app detecta que el dispositivo no está vinculado</li>
            <li>El conductor toca "Vincular dispositivo"</li>
            <li>La solicitud aparece aquí para aprobar o desvincular</li>
          </ol>
        </div>
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
            <th>Solicitado</th>
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
                    <span className="disp-badge pending">Pendiente</span>
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
                    <button
                      type="button"
                      className="disp-action approve"
                      onClick={() => onAprobar(dispositivo)}
                      disabled={busy || actingId !== null}
                    >
                      <FiCheckCircle />
                      <span>{busy ? "..." : "Aprobar"}</span>
                    </button>
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
