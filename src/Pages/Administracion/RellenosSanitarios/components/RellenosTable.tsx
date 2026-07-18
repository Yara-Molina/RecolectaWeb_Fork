// src/Pages/Administracion/RellenosSanitarios/components/RellenosTable.tsx
import type { RellenoSanitario } from "../RellenosSanitariosPage";

interface Props {
  data: RellenoSanitario[];
  onEdit: (relleno: RellenoSanitario) => void;
  onDelete: (id: number) => void;
  onDetails: (relleno: RellenoSanitario) => void;
}

export default function RellenosSanitariosTable({
  data,
  onEdit,
  onDelete,
  onDetails,
}: Props) {
  return (
    <div className="rs-table-wrapper">
      <table className="rs-table">
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>DIRECCIÓN</th>
            <th>CAPACIDAD</th>
            <th>TIPO</th>
            <th style={{ width: 320 }}>ACCIONES</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: 30 }}>
                No hay rellenos sanitarios para mostrar.
              </td>
            </tr>
          ) : (
            data.map((r) => (
              <tr key={r.relleno_id}>
                <td>
                  <b>{r.nombre}</b>
                  <div className="rs-subtext">ID: RS-{String(r.relleno_id).padStart(3, "0")}</div>
                </td>

                <td>{r.direccion || "—"}</td>

                <td>
                  <b>{r.capacidad_toneladas}</b> ton
                </td>

                <td>
                  <span className={`rs-badge ${r.es_rentado ? "inactive" : "active"}`}>
                    {r.es_rentado ? "Rentado" : "Propio"}
                  </span>
                </td>

                <td>
                  <div className="rs-actions-row">
                    <button
                      className="rs-action rs-details"
                      onClick={() => onDetails(r)}
                    >
                      👁 Detalles
                    </button>

                    <button
                      className="rs-action rs-edit"
                      onClick={() => onEdit(r)}
                    >
                      ✏ Editar
                    </button>

                    <button
                      className="rs-action rs-delete"
                      onClick={() => onDelete(r.relleno_id)}
                    >
                      🗑 Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
