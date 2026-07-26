// pages/ValidacionRecoleccion/ValidacionRecoleccion.tsx
import { useState } from 'react';
import './ValidacionRecoleccion.css';
import {
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiPauseCircle,
  FiEye,
  FiFileText,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiTruck,
  FiX,
  FiSend,
  FiAlertCircle
} from 'react-icons/fi';

type EstadoRegistro = 'completado' | 'en-proceso' | 'retrasado' | 'pendiente';
type ValidacionEstado = '—' | 'Pendiente' | 'Validado' | 'Rechazado';

interface RegistroItem {
  id: number;
  punto: string;
  nombre: string;
  direccion: string;
  fecha: string;
  hora: string;
  valido: ValidacionEstado;
  estado: EstadoRegistro;
  conductor: string;
  vehiculo: string;
  notas: string;
}

export default function ValidacionRecoleccion() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RegistroItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');

  const registros: RegistroItem[] = [
    {
      id: 1,
      punto: 'P-001',
      nombre: 'Centro Comercial Plaza',
      direccion: 'Av. Central 123',
      fecha: '2026-01-05',
      hora: '08:30',
      valido: '—',
      estado: 'completado',
      conductor: 'Juan Pérez',
      vehiculo: 'Camión RE-01',
      notas: 'Recolección normal, punto sin novedad',
    },
    {
      id: 2,
      punto: 'P-002',
      nombre: 'Zona Residencial Norte',
      direccion: 'Calle Los Pinos 456',
      fecha: '2026-01-05',
      hora: '09:15',
      valido: '—',
      estado: 'en-proceso',
      conductor: 'Carlos Ruiz',
      vehiculo: 'Camión RE-02',
      notas: 'Acceso parcialmente bloqueado',
    },
    {
      id: 3,
      punto: 'P-003',
      nombre: 'Mercado Municipal',
      direccion: 'Av. del Mercado 789',
      fecha: '2026-01-05',
      hora: '09:45',
      valido: 'Pendiente',
      estado: 'retrasado',
      conductor: 'Ana Torres',
      vehiculo: 'Camión RE-03',
      notas: 'Retraso por condiciones climáticas',
    },
    {
      id: 4,
      punto: 'P-004',
      nombre: 'Parque Industrial',
      direccion: 'Carretera Norte KM 5',
      fecha: '2026-01-05',
      hora: '—',
      valido: '—',
      estado: 'pendiente',
      conductor: 'Luis Gómez',
      vehiculo: 'Camión RE-04',
      notas: 'Pendiente de recolección',
    },
    {
      id: 5,
      punto: 'P-005',
      nombre: 'Hospital Regional',
      direccion: 'Av. Salud 321',
      fecha: '2026-01-05',
      hora: '11:30',
      valido: 'Validado',
      estado: 'completado',
      conductor: 'María López',
      vehiculo: 'Camión RE-01',
      notas: 'Recolección especial - residuos médicos',
    },
    {
      id: 6,
      punto: 'P-006',
      nombre: 'Universidad Central',
      direccion: 'Campus Universitario',
      fecha: '2026-01-05',
      hora: '12:45',
      valido: 'Rechazado',
      estado: 'completado',
      conductor: 'Roberto Díaz',
      vehiculo: 'Camión RE-05',
      notas: 'Falta evidencia fotográfica clara',
    },
  ];

  const estadisticas = {
    total: registros.length,
    pendientesValidacion: registros.filter(r => r.valido === '—' || r.valido === 'Pendiente').length,
    validados: registros.filter(r => r.valido === 'Validado').length,
    rechazados: registros.filter(r => r.valido === 'Rechazado').length
  };

  const handleOpenModal = (item: RegistroItem) => {
    setSelectedItem(item);
    setMostrarModal(true);
  };

  const getEstadoIcon = (estado: string) => {
    switch(estado) {
      case 'completado': return <FiCheckCircle />;
      case 'en-proceso': return <FiClock />;
      case 'retrasado': return <FiAlertTriangle />;
      case 'pendiente': return <FiPauseCircle />;
      default: return null;
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const registrosFiltrados = registros.filter(item => {
    if (selectedEstado !== 'todos' && item.estado !== selectedEstado) return false;
    if (searchTerm && !item.punto.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="validacion-container">
      <div className="validacion">
        {/* Header con estadísticas */}
        <header className="validacion-header">
          <div className="validacion header-content">
            <div className="validacion header-title">
              <h1>Validación de Recolección</h1>
              <p className="validacion subtitle">Verificación y aprobación de puntos recolectados</p>
            </div>
            
            <div className="validacion header-stats">
              <div className="validacion stat-card">
                <div className="validacion stat-icon-1" style={{ backgroundColor: 'rgba(234, 239, 233, 0.93)' }}>
                  <FiFileText />
                </div>
                <div>
                  <span className="validacion stat-value">{estadisticas.total}</span>
                  <span className="validacion stat-label">Registros totales</span>
                </div>
              </div>
              
              <div className="validacion stat-card">
                <div className="validacion stat-icon-2" style={{ backgroundColor: 'rgba(200, 221, 9, 0.34)' }}>
                  <FiClock />
                </div>
                <div>
                  <span className="validacion stat-value">{estadisticas.pendientesValidacion}</span>
                  <span className="validacion stat-label">Pendientes de validación</span>
                </div>
              </div>
              
              <div className="validacion stat-card">
                <div className="validacion stat-icon-3" style={{ backgroundColor: 'rgba(12, 237, 106, 0.26)' }}>
                  <FiCheckCircle />
                </div>
                <div>
                  <span className="validacion stat-value">{estadisticas.validados}</span>
                  <span className="validacion stat-label">Validados</span>
                </div>
              </div>
              
              <div className="validacion stat-card">
                <div className="validacion stat-icon-4" style={{ backgroundColor: 'rgba(231, 77, 60, 0.32)' }}>
                  <FiAlertCircle />
                </div>
                <div>
                  <span className="validacion stat-value">{estadisticas.rechazados}</span>
                  <span className="validacion stat-label">Rechazados</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Panel de controles */}
        <div className="validacion controles-panel">
          <div className="validacion controles-left">
            <div className="validacion search-container">
              <FiSearch className="validacion search-icon" />
              <input
                type="text"
                placeholder="Buscar por punto o dirección..."
                className="validacion search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="validacion controles-right">
            <div className="validacion filtros-rapidos">
              <button 
                className={`validacion filtro-btn ${selectedEstado === 'todos' ? 'validacion active' : ''}`}
                onClick={() => setSelectedEstado('todos')}
              >
                Todos
              </button>
              <button 
                className={`validacion filtro-btn ${selectedEstado === 'completado' ? 'validacion active' : ''}`}
                onClick={() => setSelectedEstado('completado')}
              >
                <FiCheckCircle />
                <span>Completados</span>
              </button>
              <button 
                className={`validacion filtro-btn ${selectedEstado === 'pendiente' ? 'validacion active' : ''}`}
                onClick={() => setSelectedEstado('pendiente')}
              >
                <FiClock />
                <span>Pendientes</span>
              </button>
              <button 
                className={`validacion filtro-btn ${selectedEstado === 'retrasado' ? 'validacion active' : ''}`}
                onClick={() => setSelectedEstado('retrasado')}
              >
                <FiAlertTriangle />
                <span>Retrasados</span>
              </button>
            </div>

            <button className="validacion action-btn">
              <FiFilter />
              <span>Filtros avanzados</span>
            </button>
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="validacion table-container">
          <div className="validacion table-header">
            <div className="validacion table-summary">
              Mostrando {registrosFiltrados.length} de {registros.length} registros
            </div>
            <div className="validacion table-actions">
              <FiCalendar />
              <span>Última actualización: Hoy 14:30</span>
            </div>
          </div>

          <div className="validacion table-wrapper">
            <table className="validacion validacion-table">
              <thead>
                <tr>
                  <th>Punto</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Validación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.map((item) => (
                  <tr key={item.id} className="validacion table-row">
                    <td className="validacion punto-cell">
                      <div className="validacion punto-info">
                        <div className="validacion punto-codigo">{item.punto}</div>
                        <div className="validacion punto-nombre">{item.nombre}</div>
                      </div>
                    </td>
                    <td className="validacion fecha-cell">{formatFecha(item.fecha)}</td>
                    <td className="validacion hora-cell">{item.hora}</td>
                    <td className="validacion validacion-cell">
                      <div className={`validacion validacion-badge validacion validacion-${item.valido.toLowerCase()}`}>
                        {item.valido}
                      </div>
                    </td>
                    <td className="validacion estado-cell">
                      <div className={`validacion estado-badge validacion estado-${item.estado}`}>
                        {getEstadoIcon(item.estado)}
                        <span>
                          {item.estado === 'completado' ? 'Completado' :
                           item.estado === 'en-proceso' ? 'En proceso' :
                           item.estado === 'retrasado' ? 'Retrasado' : 'Pendiente'}
                        </span>
                      </div>
                    </td>
                    <td className="validacion acciones-cell">
                      <button 
                        className="validacion btn-detalles"
                        onClick={() => handleOpenModal(item)}
                      >
                        <FiEye />
                        <span>Ver detalles</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Modernizado */}
        <div className={`validacion modal-overlay ${mostrarModal ? 'show' : ''}`}>
          <div className="validacion modal" onClick={(e) => e.stopPropagation()}>
            <div className="validacion modal-header">
              <h2 className="validacion modal-title">
                <FiFileText />
                <span>Validación de Recolección</span>
              </h2>
              <button 
                className="validacion btn-cerrar-modal"
                onClick={() => setMostrarModal(false)}
              >
                <FiX />
              </button>
            </div>

            {selectedItem && (
              <>
                <div className="validacion modal-info-grid">
                  <div className="validacion info-item">
                    <div className="validacion info-label">
                      <FiMapPin />
                      <span>Punto:</span>
                    </div>
                    <div className="validacion info-value">{selectedItem.punto} - {selectedItem.nombre}</div>
                  </div>
                  
                  <div className="validacion info-item">
                    <div className="validacion info-label">
                      <FiCalendar />
                      <span>Fecha:</span>
                    </div>
                    <div className="validacion info-value">{formatFecha(selectedItem.fecha)} {selectedItem.hora}</div>
                  </div>
                  
                  <div className="validacion info-item">
                    <div className="validacion info-label">
                      <FiUser />
                      <span>Conductor:</span>
                    </div>
                    <div className="validacion info-value">{selectedItem.conductor}</div>
                  </div>
                  
                  <div className="validacion info-item">
                    <div className="validacion info-label">
                      <FiTruck />
                      <span>Vehículo:</span>
                    </div>
                    <div className="validacion info-value">{selectedItem.vehiculo}</div>
                  </div>
                </div>

                {/* Sección de estado de validación */}
                <div className="validacion modal-section">
                  <label className="validacion section-label">Estado de Validación</label>
                  <div className="validacion decision-actions">
                    <button className="validacion btn-validar">
                      <FiCheckCircle />
                      <span>Aprobar recolección</span>
                    </button>
                    <button className="validacion btn-rechazar">
                      <FiAlertCircle />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>

                <div className="validacion modal-section">
                  <label className="validacion section-label">
                    <FiFileText />
                    <span>Notas del conductor</span>
                  </label>
                  <div className="validacion notas-contenido">
                    {selectedItem.notas}
                  </div>
                </div>

                {/* Sección de estado de la recolección */}
                <div className="validacion modal-section">
                  <label className="validacion section-label">Estado de la Recolección</label>
                  <div>
                    <div className={`validacion estado-badge validacion estado-${selectedItem.estado}`}>
                      {getEstadoIcon(selectedItem.estado)}
                      <span>
                        {selectedItem.estado === 'completado' ? 'Completado' :
                         selectedItem.estado === 'en-proceso' ? 'En proceso' :
                         selectedItem.estado === 'retrasado' ? 'Retrasado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="validacion modal-section">
                  <label className="validacion section-label">Comentarios del supervisor</label>
                  <textarea 
                    className="validacion comentarios-input"
                    placeholder="Agregue observaciones o motivo del rechazo..."
                    rows={3}
                  />
                </div>

                <div className="validacion modal-footer">
                  <button className="validacion btn-secundario">
                    <FiSend />
                    <span>Enviar a revisión</span>
                  </button>
                  <button 
                    className="validacion btn-principal"
                    onClick={() => setMostrarModal(false)}
                  >
                    <FiCheckCircle />
                    <span>Guardar y cerrar</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
