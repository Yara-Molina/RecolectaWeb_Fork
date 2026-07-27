interface DiaRecoleccionConfig {
  id: number;
  ruta: string;
  colonia: string;
  dias: string[];
  turno: "Matutino" | "Vespertino";
  estado: "Activo" | "Inactivo";
  fechaRegistro: string;
}

interface Props {
  data: DiaRecoleccionConfig[];
  onEdit: (config: DiaRecoleccionConfig) => void;
  onDelete: (id: number) => void;
}

export default function DiasRecoleccionTable({
  data,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="dias dr-table-section">
      <div className="dias dr-table-top">
        <span>Mostrando {data.length} configuraciones</span>
        <span className="dias muted">
          Total registros: {data.length}
        </span>
      </div>
      
      <div className="dias dr-table-wrap">
        <table className="dias dr-table">
          <thead>
            <tr>
              <th>RUTA</th>
              <th>COLONIA</th>
              <th>DÍAS</th>
              <th>TURNO</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="dias dr-empty-state">
                  No hay configuraciones disponibles.
                </td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="dias dr-table-row">
                  <td className="dias dr-table-cell">
                    <span className="dias dr-ruta-text">{c.ruta}</span>
                  </td>
                  
                  <td className="dias dr-table-cell">
                    <span className="dias dr-colonia-text">{c.colonia}</span>
                  </td>
                  
                  <td className="dias dr-table-cell">
                    <div className="dias dr-dias-badge">
                      {c.dias.map((dia) => (
                        <span key={dia} className="dias dr-dia-item">
                          {dia}
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  <td className="dias dr-table-cell">
                    <span className={`dias dr-turno-badge dias dr-turno-${c.turno.toLowerCase()}`}>
                      {c.turno}
                    </span>
                  </td>
                  
                  <td className="dias dr-table-cell">
                    <span className={`dias dr-estado-badge dias dr-estado-${c.estado.toLowerCase()}`}>
                      {c.estado}
                    </span>
                  </td>
                  
                  <td className="dias dr-actions-cell">
                    <button 
                      className="dias dr-btn-edit" 
                      onClick={() => onEdit(c)}
                      title="Editar configuración"
                    >
                      <span role="img" aria-label="editar">✏️</span>
                      <span>Editar</span>
                    </button>
                    
                    <button 
                      className="dias dr-btn-delete" 
                      onClick={() => onDelete(c.id)}
                      title="Eliminar configuración"
                    >
                      <span role="img" aria-label="eliminar">🗑️</span>
                      <span>Eliminar</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
