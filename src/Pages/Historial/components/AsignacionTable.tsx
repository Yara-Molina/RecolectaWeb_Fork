// src/Pages/Historial/components/AsignacionTable.tsx
import { FiCheckCircle, FiClock, FiEdit2, FiLogOut, FiTrash2 } from 'react-icons/fi';
import type { HistorialAsignacion } from '../Historial';

interface Props {
  asignaciones: HistorialAsignacion[];
  getPlaca: (id_camion: number) => string;
  getConductorNombre: (id_chofer: number) => string;
  formatFecha: (fecha: string) => string;
  onEditar: (asignacion: HistorialAsignacion) => void;
  onDarDeBaja: (asignacion: HistorialAsignacion) => void;
  onEliminar: (id_historial: number) => void;
  // Conductor: solo puede consultar el historial, no modificarlo.
  readOnly?: boolean;
}

export default function AsignacionTable({
  asignaciones,
  getPlaca,
  getConductorNombre,
  formatFecha,
  onEditar,
  onDarDeBaja,
  onEliminar,
  readOnly = false,
}: Props) {
  if (asignaciones.length === 0) {
    return (
      <div className="historial empty-state">
        <h3>No hay asignaciones para mostrar</h3>
        <p>Intenta cambiar los filtros o crea una nueva asignacion.</p>
      </div>
    );
  }

  return (
    <div className="historial table-wrapper">
      <table className="historial historial-table">
        <thead>
          <tr>
            <th>Camion</th>
            <th>Conductor</th>
            <th>Fecha asignacion</th>
            <th>Fecha baja</th>
            <th>Estado</th>
            {!readOnly && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {asignaciones.map((item) => {
            const activa = !item.fecha_baja;
            return (
              <tr key={item.id_historial} className="historial table-row">
                <td className="historial ruta-cell">
                  <div className="historial ruta-numero">{getPlaca(item.id_camion)}</div>
                </td>
                <td className="historial conductor-cell">
                  <div className="historial conductor-nombre">{getConductorNombre(item.id_chofer)}</div>
                </td>
                <td className="historial fecha-cell">
                  <div className="historial fecha">{formatFecha(item.fecha_asignacion)}</div>
                </td>
                <td className="historial fecha-cell">
                  <div className="historial fecha">{formatFecha(item.fecha_baja)}</div>
                </td>
                <td className="historial estado-cell">
                  <div className={`historial estado-badge historial estado-${activa ? 'completado' : 'pendiente'}`}>
                    {activa ? <FiCheckCircle /> : <FiClock />}
                    <span>{activa ? 'Activa' : 'Finalizada'}</span>
                  </div>
                </td>
                {!readOnly && (
                  <td className="historial acciones-cell">
                    <div className="historial acciones-group">
                      <button className="historial btn-detalles" onClick={() => onEditar(item)}>
                        <FiEdit2 />
                        <span>Editar</span>
                      </button>

                      {activa && (
                        <button className="historial btn-baja" onClick={() => onDarDeBaja(item)}>
                          <FiLogOut />
                          <span>Dar de baja</span>
                        </button>
                      )}

                      <button className="historial btn-eliminar" onClick={() => onEliminar(item.id_historial)}>
                        <FiTrash2 />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
