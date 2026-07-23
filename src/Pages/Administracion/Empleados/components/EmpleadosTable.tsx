import { FiEdit2, FiTrash2, FiTruck } from "react-icons/fi";
import type { Empleado } from "../EmpleadosPage";
import { ROLES, ROLE_NAMES, type RoleId } from "../../../../services/auth";

interface Props {
  data: Empleado[];
  camionPorConductor: Map<number, string>;
  onDelete: (empleadoId: number) => void;
  onEdit: (empleado: Empleado) => void;
  onAsignarCamion: (empleado: Empleado) => void;
}

const ROLE_BADGE_CLASS: Record<RoleId, string> = {
  [ROLES.ADMIN]: "role-admin",
  [ROLES.CONDUCTOR]: "role-conductor",
  [ROLES.SUPERVISOR]: "role-operador",
  [ROLES.COORDINADOR]: "role-coordinador",
};

export default function EmpleadosTable({
  data,
  camionPorConductor,
  onDelete,
  onEdit,
  onAsignarCamion,
}: Props) {
  if (data.length === 0) {
    return <div className="emp-loading">No hay empleados para mostrar.</div>;
  }

  return (
    <div className="emp-table-wrap">
      <table className="emp-table">
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>EMAIL</th>
            <th>ROL</th>
            <th>CAMIÓN</th>
            <th>FECHA REGISTRO</th>
            <th>ACCIONES</th>
          </tr>
        </thead>

        <tbody>
          {data.map((empleado) => (
            <tr key={empleado.id}>
              <td>
                <b>{empleado.nombre}</b>
                <div className="emp-subtext">ID: EMP-{String(empleado.id).padStart(3, "0")}</div>
              </td>
              <td>{empleado.email}</td>
              <td>
                <span className={`emp-badge ${ROLE_BADGE_CLASS[empleado.rolId as RoleId] ?? ""}`}>
                  {ROLE_NAMES[empleado.rolId as RoleId] ?? "—"}
                </span>
              </td>
              <td>
                {empleado.rolId === ROLES.CONDUCTOR ? (
                  camionPorConductor.get(empleado.id) ? (
                    <span className="emp-badge active">{camionPorConductor.get(empleado.id)}</span>
                  ) : (
                    <span className="emp-badge inactive">Sin asignar</span>
                  )
                ) : (
                  <span className="emp-subtext">—</span>
                )}
              </td>
              <td>
                {empleado.created_at
                  ? new Date(empleado.created_at).toLocaleDateString("es-MX")
                  : "—"}
              </td>
              <td>
                <div className="emp-actions-row">
                  {empleado.rolId === ROLES.CONDUCTOR && (
                    <button
                      className="emp-action assign"
                      onClick={() => onAsignarCamion(empleado)}
                    >
                      <FiTruck />
                      <span>{camionPorConductor.get(empleado.id) ? "Cambiar" : "Asignar"}</span>
                    </button>
                  )}
                  <button className="emp-action edit" onClick={() => onEdit(empleado)}>
                    <FiEdit2 />
                    <span>Editar</span>
                  </button>
                  <button className="emp-action delete" onClick={() => onDelete(empleado.id)}>
                    <FiTrash2 />
                    <span>Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
