// src/Pages/Administracion/Camiones/components/CamionesTable.tsx
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { ESTADOS_DISPONIBILIDAD } from "../CamionesPage";
import type { Camion, TipoCamion } from "../CamionesPage";

// El backend devuelve color_disponibilidad como nombre CSS ("green", "orange", ...),
// no como hex, así que no sirve para el truco de transparencia (`${color}1a`).
// Usamos nuestro propio mapa de hex (mismo que en el formulario) para pintar el badge,
// y dejamos el nombre que manda el backend como texto.
function getColorHex(nombreDisponibilidad: string): string | undefined {
  return ESTADOS_DISPONIBILIDAD.find((e) => e.nombre === nombreDisponibilidad)?.color;
}

interface Props {
  camiones: Camion[];
  tiposCamion: TipoCamion[];
  onEditar: (camion: Camion) => void;
  onEliminar: (camion_id: number) => void;
  // Conductor: solo puede consultar el listado de camiones.
  readOnly?: boolean;
}

export default function CamionesTable({ camiones, tiposCamion, onEditar, onEliminar, readOnly = false }: Props) {
  if (camiones.length === 0) {
    return (
      <div className="empty-state">
        <h3>No hay camiones para mostrar</h3>
        <p>Intenta cambiar los filtros o crea un nuevo camión.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>PLACA</th>
            <th>MODELO</th>
            <th>TIPO</th>
            <th>RENTADO</th>
            <th>DISPONIBILIDAD</th>
            {!readOnly && <th style={{ width: 260 }}>ACCIONES</th>}
          </tr>
        </thead>

        <tbody>
          {camiones.map((c) => (
            <tr key={c.camion_id}>
              <td className="mono">{c.placa}</td>
              <td>{c.modelo}</td>
              <td>{tiposCamion.find((t) => t.tipo_camion_id === c.tipo_camion_id)?.nombre ?? "—"}</td>
              <td>
                <span className={c.es_rentado ? "pill rentado" : "pill"}>
                  {c.es_rentado ? "Sí" : "No"}
                </span>
              </td>

              <td>
                {(() => {
                  const hex = getColorHex(c.nombre_disponibilidad);
                  return (
                    <span
                      className="status"
                      style={{
                        backgroundColor: hex ? `${hex}1a` : undefined,
                        color: hex ?? undefined,
                        borderColor: hex ? `${hex}33` : undefined,
                      }}
                    >
                      {c.nombre_disponibilidad || "—"}
                    </span>
                  );
                })()}
              </td>

              {!readOnly && (
                <td>
                  <div className="actions">
                    <button className="btn btn-edit" onClick={() => onEditar(c)}>
                      <FiEdit2 />
                      <span>Editar</span>
                    </button>

                    <button className="btn btn-delete" onClick={() => onEliminar(c.camion_id)}>
                      <FiTrash2 />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
