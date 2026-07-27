// pages/Alertas/Alertas.tsx
import { useState } from 'react';
import './Alertas.css';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock, 
  FiTruck,
  FiAlertCircle,
  FiUserX,
  FiCloud,
  FiTool,
  FiFilter,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiList,
  FiMapPin
} from 'react-icons/fi';

type TipoAlerta = 'mecanica' | 'acceso' | 'clima' | 'personal' | 'capacidad' | 'trafico' | 'otro';
type EstadoAlerta = 'pendiente' | 'en-proceso' | 'resuelto' | 'cancelado';

type Alerta = {
  id: number;
  tipo: TipoAlerta;
  detalles: string;
  puntosAfectados: string[];
  ruta: string;
  vehiculo: string;
  estado: EstadoAlerta;
  fechaCreacion: string;
  conductor?: string;
  motivo?: string;
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';
};

export default function Alertas() {
  const [activeTab, setActiveTab] = useState<'ver' | 'crear'>('ver');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Datos del formulario
  const [formData, setFormData] = useState<Partial<Alerta>>({
    tipo: 'mecanica',
    detalles: '',
    puntosAfectados: [],
    ruta: '',
    vehiculo: '',
    estado: 'pendiente',
    fechaCreacion: new Date().toISOString().slice(0, 16),
    conductor: '',
    prioridad: 'media'
  });

  const [nuevoPunto, setNuevoPunto] = useState('');

  // Datos iniciales de alertas
  const [alertas, setAlertas] = useState<Alerta[]>([
    {
      id: 1,
      tipo: 'mecanica',
      detalles: 'Falla mecánica del vehículo - motor sobrecalentado',
      puntosAfectados: ['Centro Comercial Plaza', 'Zona Residencial Norte', 'Parque Central'],
      ruta: 'Ruta 01',
      vehiculo: 'Camión RE-01',
      estado: 'pendiente',
      fechaCreacion: '2026-01-05 08:30',
      conductor: 'Juan Pérez',
      prioridad: 'alta'
    },
    {
      id: 2,
      tipo: 'acceso',
      detalles: 'Acceso bloqueado al punto por obras viales',
      puntosAfectados: ['Mercado Municipal', 'Hospital Regional'],
      ruta: 'Ruta 02',
      vehiculo: 'Camión RE-02',
      estado: 'en-proceso',
      fechaCreacion: '2026-01-05 09:15',
      conductor: 'Carlos Ruiz',
      prioridad: 'media'
    },
    {
      id: 3,
      tipo: 'clima',
      detalles: 'Retraso por condiciones climáticas adversas',
      puntosAfectados: ['Zona Industrial', 'Universidad', 'Centro Deportivo'],
      ruta: 'Ruta 03',
      vehiculo: 'Camión RE-03',
      estado: 'pendiente',
      fechaCreacion: '2026-01-05 10:45',
      conductor: 'Ana Torres',
      prioridad: 'baja'
    },
    {
      id: 4,
      tipo: 'personal',
      detalles: 'Ausencia del conductor por enfermedad',
      puntosAfectados: ['Aeropuerto'],
      ruta: 'Ruta 04',
      vehiculo: 'Camión RE-04',
      estado: 'pendiente',
      fechaCreacion: '2026-01-05 11:20',
      conductor: 'Luis Gómez',
      prioridad: 'alta'
    },
    {
      id: 5,
      tipo: 'capacidad',
      detalles: 'Exceso de capacidad en vehículo - sobrecarga',
      puntosAfectados: ['Centro Comercial Sur', 'Zona Residencial Este'],
      ruta: 'Ruta 05',
      vehiculo: 'Camión RE-05',
      estado: 'resuelto',
      fechaCreacion: '2026-01-04 14:30',
      conductor: 'María López',
      prioridad: 'media'
    },
  ]);

  const rutasDisponibles = ['Ruta 01', 'Ruta 02', 'Ruta 03', 'Ruta 04', 'Ruta 05'];
  const vehiculosDisponibles = ['Camión RE-01', 'Camión RE-02', 'Camión RE-03', 'Camión RE-04', 'Camión RE-05'];

  const getTipoIcon = (tipo: string) => {
    switch(tipo) {
      case 'mecanica': return <FiTool />;
      case 'acceso': return <FiAlertCircle />;
      case 'clima': return <FiCloud />;
      case 'personal': return <FiUserX />;
      case 'capacidad': return <FiAlertTriangle />;
      case 'trafico': return <FiClock />;
      default: return <FiAlertTriangle />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch(tipo) {
      case 'mecanica': return '#e74c3c';
      case 'acceso': return '#f39c12';
      case 'clima': return '#3498db';
      case 'personal': return '#9b59b6';
      case 'capacidad': return '#e67e22';
      case 'trafico': return '#34495e';
      default: return '#95a5a6';
    }
  };

  const getTipoTexto = (tipo: TipoAlerta) => {
    switch(tipo) {
      case 'mecanica': return 'Falla Mecánica';
      case 'acceso': return 'Acceso Bloqueado';
      case 'clima': return 'Condiciones Climáticas';
      case 'personal': return 'Problema de Personal';
      case 'capacidad': return 'Exceso de Capacidad';
      case 'trafico': return 'Problemas de Tráfico';
      default: return 'Otro';
    }
  };

  const getEstadoTexto = (estado: EstadoAlerta) => {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'en-proceso': return 'En Proceso';
      case 'resuelto': return 'Resuelto';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendiente';
    }
  };

  const getPrioridadColor = (prioridad?: string) => {
    switch(prioridad) {
      case 'baja': return '#2ecc71';
      case 'media': return '#f39c12';
      case 'alta': return '#e74c3c';
      case 'critica': return '#8e44ad';
      default: return '#95a5a6';
    }
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleAddPunto = () => {
    if (nuevoPunto.trim() && !formData.puntosAfectados?.includes(nuevoPunto.trim())) {
      setFormData({
        ...formData,
        puntosAfectados: [...(formData.puntosAfectados || []), nuevoPunto.trim()]
      });
      setNuevoPunto('');
    }
  };

  const handleRemovePunto = (index: number) => {
    const nuevosPuntos = formData.puntosAfectados?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, puntosAfectados: nuevosPuntos });
  };

  const handleCreateAlerta = () => {
    if (!formData.tipo || !formData.detalles || !formData.ruta || !formData.vehiculo) {
      alert('Por favor complete los campos requeridos: Tipo, Detalles, Ruta y Vehículo');
      return;
    }

    const nuevaAlerta: Alerta = {
      id: alertas.length > 0 ? Math.max(...alertas.map(a => a.id)) + 1 : 1,
      tipo: formData.tipo,
      detalles: formData.detalles || '',
      puntosAfectados: formData.puntosAfectados || [],
      ruta: formData.ruta || '',
      vehiculo: formData.vehiculo || '',
      estado: formData.estado || 'pendiente',
      fechaCreacion: new Date().toISOString().slice(0, 16),
      conductor: formData.conductor || '',
      prioridad: formData.prioridad || 'media'
    };

    setAlertas([...alertas, nuevaAlerta]);
    handleResetForm();
    setActiveTab('ver');
  };

  const handleUpdateAlerta = () => {
    if (!editingId || !formData.tipo || !formData.detalles || !formData.ruta || !formData.vehiculo) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    setAlertas(alertas.map(alerta => 
      alerta.id === editingId 
        ? { 
            ...alerta, 
            tipo: formData.tipo!,
            detalles: formData.detalles || '',
            puntosAfectados: formData.puntosAfectados || [],
            ruta: formData.ruta || '',
            vehiculo: formData.vehiculo || '',
            estado: formData.estado || 'pendiente',
            conductor: formData.conductor || '',
            prioridad: formData.prioridad || 'media'
          }
        : alerta
    ));

    setIsEditing(false);
    setEditingId(null);
    handleResetForm();
    setActiveTab('ver');
  };

  const handleDeleteAlerta = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar esta alerta?')) {
      setAlertas(alertas.filter(alerta => alerta.id !== id));
    }
  };

  const handleEditAlerta = (alerta: Alerta) => {
    setActiveTab('crear');
    setIsEditing(true);
    setEditingId(alerta.id);
    setFormData({ ...alerta });
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      tipo: 'mecanica',
      detalles: '',
      puntosAfectados: [],
      ruta: '',
      vehiculo: '',
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString().slice(0, 16),
      conductor: '',
      prioridad: 'media'
    });
    setNuevoPunto('');
  };

  const alertasFiltradas = alertas.filter(alerta => {
    if (activeFilter === 'pendientes' && alerta.estado !== 'pendiente') return false;
    if (activeFilter === 'en-proceso' && alerta.estado !== 'en-proceso') return false;
    if (activeFilter === 'resueltas' && alerta.estado !== 'resuelto') return false;
    
    if (searchTerm && 
        !alerta.ruta.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !alerta.detalles.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alerta.tipo.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const alertasPendientes = alertas.filter(a => a.estado === 'pendiente').length;
  const puntosPendientes = alertas.reduce((total, alerta) => total + alerta.puntosAfectados.length, 0);

  return (
    <div className="alertas alertas-container">
      {/* Sección 1: Header con estadísticas */}
      <header className="alertas-header">
        <div className="alertas header-content">
          <div className="alertas header-title">
            <h1>Alertas del Sistema</h1>
            <p className="alertas subtitle">Gestión de alertas y problemas en las rutas</p>
          </div>
          
          <div className="alertas header-stats">
            <div className="alertas stat-card">
              <div className="alertas stat-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c' }}>
                <FiAlertTriangle />
              </div>
              <div>
                <span className="alertas stat-value">{alertasPendientes}</span>
                <span className="alertas stat-label">Alertas activas</span>
              </div>
            </div>
            
            <div className="alertas stat-card">
              <div className="alertas stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.2)', color: '#3498db' }}>
                <FiTruck />
              </div>
              <div>
                <span className="alertas stat-value">
                  {[...new Set(alertas.filter(a => a.estado === 'pendiente').map(a => a.ruta))].length}
                </span>
                <span className="alertas stat-label">Rutas afectadas</span>
              </div>
            </div>
            
            <div className="alertas stat-card">
              <div className="alertas stat-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71' }}>
                <FiCheckCircle />
              </div>
              <div>
                <span className="alertas stat-value">{puntosPendientes}</span>
                <span className="alertas stat-label">Puntos afectados</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs de navegación */}
      <div className="alertas tabs-navigation">
        <div className="alertas tabs-container">
          <button 
            className={`alertas tab-btn ${activeTab === 'ver' ? 'active' : ''}`}
            onClick={() => setActiveTab('ver')}
          >
            <FiList />
            <span>Ver Alertas</span>
          </button>
          <button 
            className={`alertas tab-btn ${activeTab === 'crear' ? 'active' : ''}`}
            onClick={() => setActiveTab('crear')}
          >
            <FiPlus />
            <span>{isEditing ? 'Editar Alerta' : 'Crear Alerta'}</span>
          </button>
        </div>
      </div>

      {/* Panel de Ver Alertas */}
      {activeTab === 'ver' && (
        <>
          {/* Sección 2: Filtros y búsqueda */}
          <div className="alertas filtros-container">
            <div className="alertas filtros-header">
              <h3 className="alertas filtros-title">Filtros de Alertas</h3>
              <div className="alertas table-search">
                <FiSearch className="alertas search-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar por ruta, tipo o detalles..."
                  className="alertas search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="alertas filtros-rapidos">
              <button 
                className={`alertas quick-filter-btn ${activeFilter === 'todos' ? 'alertas active' : ''}`}
                onClick={() => handleFilterClick('todos')}
              >
                Todas las alertas
              </button>
              <button 
                className={`alertas quick-filter-btn ${activeFilter === 'pendientes' ? 'alertas active' : ''}`}
                onClick={() => handleFilterClick('pendientes')}
              >
                Solo pendientes
              </button>
              <button 
                className={`alertas quick-filter-btn ${activeFilter === 'en-proceso' ? 'alertas active' : ''}`}
                onClick={() => handleFilterClick('en-proceso')}
              >
                En proceso
              </button>
              <button 
                className={`alertas quick-filter-btn ${activeFilter === 'resueltas' ? 'alertas active' : ''}`}
                onClick={() => handleFilterClick('resueltas')}
              >
                Resueltas
              </button>
            </div>

            <div className="alertas tipos-alerta">
              <div className="alertas tipo-item" style={{ borderLeftColor: '#e74c3c' }}>
                <FiTool />
                <span>Fallas mecánicas</span>
              </div>
              <div className="alertas tipo-item" style={{ borderLeftColor: '#f39c12' }}>
                <FiAlertCircle />
                <span>Acceso bloqueado</span>
              </div>
              <div className="alertas tipo-item" style={{ borderLeftColor: '#3498db' }}>
                <FiCloud />
                <span>Condiciones climáticas</span>
              </div>
              <div className="alertas tipo-item" style={{ borderLeftColor: '#9b59b6' }}>
                <FiUserX />
                <span>Problemas de personal</span>
              </div>
            </div>
          </div>

          {/* Sección 3: Tabla de alertas */}
          <div className="alertas table-container">
            <div className="alertas table-header">
              <div className="alertas table-summary">
                Mostrando {alertasFiltradas.length} de {alertas.length} alertas
              </div>
              <button className="alertas btn-exportar">
                <FiFilter />
                <span>Ordenar por prioridad</span>
              </button>
            </div>

            <div className="alertas table-wrapper">
              <table className="alertas alertas-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Detalles</th>
                    <th>Puntos afectados</th>
                    <th>Ruta y Vehículo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alertasFiltradas.map((alerta) => (
                    <tr key={alerta.id} className={`alertas table-row alerta-${alerta.estado}`}>
                      <td className="alertas tipo-cell">
                        <div className="alertas tipo-indicator" style={{ backgroundColor: getTipoColor(alerta.tipo) }}>
                          {getTipoIcon(alerta.tipo)}
                        </div>
                        <div className="alertas tipo-texto">
                          {getTipoTexto(alerta.tipo)}
                        </div>
                        {alerta.prioridad && (
                          <div 
                            className="alertas prioridad-badge"
                            style={{ backgroundColor: getPrioridadColor(alerta.prioridad) }}
                          >
                            {alerta.prioridad.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="alertas detalles-cell">
                        <div className="alertas detalles-info">
                          <div className="alertas motivo">{alerta.detalles}</div>
                          <div className="alertas fecha">{alerta.fechaCreacion}</div>
                          {alerta.conductor && (
                            <div className="alertas conductor">
                              <FiUserX />
                              <span>{alerta.conductor}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="alertas puntos-cell">
                        <div className="alertas puntos-info">
                          <div className="alertas cantidad-badge">
                            <span className="alertas numero">{alerta.puntosAfectados.length}</span>
                            <span className="alertas texto">puntos</span>
                          </div>
                          <div className="alertas puntos-lista">
                            {alerta.puntosAfectados.slice(0, 2).map((punto, idx) => (
                              <div key={idx} className="alertas punto-item">
                                <FiMapPin />
                                <span>{punto}</span>
                              </div>
                            ))}
                            {alerta.puntosAfectados.length > 2 && (
                              <div className="alertas punto-mas">+{alerta.puntosAfectados.length - 2} más</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="alertas ruta-cell">
                        <div className="alertas ruta-info">
                          <div className="alertas ruta-nombre">{alerta.ruta}</div>
                          <div className="alertas vehiculo-info">
                            <FiTruck />
                            <span>{alerta.vehiculo}</span>
                          </div>
                        </div>
                      </td>
                      <td className="alertas estado-cell">
                        <div className={`alertas estado-badge estado-${alerta.estado}`}>
                          {alerta.estado === 'pendiente' ? <FiAlertTriangle /> : 
                           alerta.estado === 'en-proceso' ? <FiClock /> : <FiCheckCircle />}
                          <span>{getEstadoTexto(alerta.estado)}</span>
                        </div>
                      </td>
                      <td className="alertas acciones-cell">
                        <button 
                          className="alertas btn-editar"
                          onClick={() => handleEditAlerta(alerta)}
                        >
                          <FiEdit2 />
                          <span>Editar</span>
                        </button>
                        <button 
                          className="alertas btn-eliminar"
                          onClick={() => handleDeleteAlerta(alerta.id)}
                        >
                          <FiTrash2 />
                          <span>Eliminar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sección de resumen */}
            <div className="alertas resumen-container">
              <div className="alertas resumen-item">
                <h4>Resumen de alertas</h4>
                <div className="alertas resumen-stats">
                  <div className="alertas resumen-stat">
                    <span className="alertas stat-num">{alertasPendientes}</span>
                    <span className="alertas stat-label">Pendientes</span>
                  </div>
                  <div className="alertas resumen-stat">
                    <span className="alertas stat-num">{alertas.filter(a => a.estado === 'en-proceso').length}</span>
                    <span className="alertas stat-label">En proceso</span>
                  </div>
                  <div className="alertas resumen-stat">
                    <span className="alertas stat-num">{alertas.filter(a => a.estado === 'resuelto').length}</span>
                    <span className="alertas stat-label">Resueltas</span>
                  </div>
                  <div className="alertas resumen-stat">
                    <span className="alertas stat-num">{puntosPendientes}</span>
                    <span className="alertas stat-label">Puntos afectados</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Panel de Crear/Editar Alerta */}
      {activeTab === 'crear' && (
        <div className="alertas crear-alerta-container">
          <div className="alertas crear-alerta-form">
            <h2 className="alertas form-title">
              {isEditing ? 'Editar Alerta' : 'Crear Nueva Alerta'}
            </h2>
            
            <div className="alertas form-grid">
              {/* Tipo de Alerta */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Tipo de Alerta *
                </label>
                <select
                  className="alertas form-select"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as TipoAlerta})}
                >
                  <option value="mecanica">Falla Mecánica</option>
                  <option value="acceso">Acceso Bloqueado</option>
                  <option value="clima">Condiciones Climáticas</option>
                  <option value="personal">Problema de Personal</option>
                  <option value="capacidad">Exceso de Capacidad</option>
                  <option value="trafico">Problemas de Tráfico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Prioridad */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Prioridad
                </label>
                <select
                  className="alertas form-select"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({...formData, prioridad: e.target.value as 'baja' | 'media' | 'alta' | 'critica'})}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

              {/* Detalles */}
              <div className="alertas form-group full-width">
                <label className="alertas form-label">
                  Detalles *
                </label>
                <textarea
                  className="alertas form-textarea"
                  value={formData.detalles}
                  onChange={(e) => setFormData({...formData, detalles: e.target.value})}
                  placeholder="Describa el problema o situación..."
                  rows={4}
                />
              </div>

              {/* Puntos Afectados */}
              <div className="alertas form-group full-width">
                <label className="alertas form-label">
                  Puntos Afectados
                </label>
                <div className="alertas puntos-input-container">
                  <input
                    type="text"
                    className="alertas puntos-input"
                    value={nuevoPunto}
                    onChange={(e) => setNuevoPunto(e.target.value)}
                    placeholder="Ingrese un punto afectado"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPunto()}
                  />
                  <button 
                    type="button" 
                    className="alertas btn-agregar-punto"
                    onClick={handleAddPunto}
                  >
                    <FiPlus />
                  </button>
                </div>
                
                {/* Lista de puntos */}
                <div className="alertas puntos-lista-form">
                  {formData.puntosAfectados?.map((punto, index) => (
                    <div key={index} className="alertas punto-item-form">
                      <FiMapPin />
                      <span>{punto}</span>
                      <button 
                        type="button" 
                        className="alertas btn-remover-punto"
                        onClick={() => handleRemovePunto(index)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                  {(!formData.puntosAfectados || formData.puntosAfectados.length === 0) && (
                    <div className="alertas sin-puntos">
                      No hay puntos afectados agregados
                    </div>
                  )}
                </div>
              </div>

              {/* Ruta */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Ruta *
                </label>
                <select
                  className="alertas form-select"
                  value={formData.ruta}
                  onChange={(e) => setFormData({...formData, ruta: e.target.value})}
                >
                  <option value="">Seleccione una ruta</option>
                  {rutasDisponibles.map(ruta => (
                    <option key={ruta} value={ruta}>{ruta}</option>
                  ))}
                </select>
              </div>

              {/* Vehículo */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Vehículo *
                </label>
                <select
                  className="alertas form-select"
                  value={formData.vehiculo}
                  onChange={(e) => setFormData({...formData, vehiculo: e.target.value})}
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehiculosDisponibles.map(vehiculo => (
                    <option key={vehiculo} value={vehiculo}>{vehiculo}</option>
                  ))}
                </select>
              </div>

              {/* Conductor */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Conductor (Opcional)
                </label>
                <input
                  type="text"
                  className="alertas form-input"
                  value={formData.conductor}
                  onChange={(e) => setFormData({...formData, conductor: e.target.value})}
                  placeholder="Nombre del conductor"
                />
              </div>

              {/* Estado */}
              <div className="alertas form-group">
                <label className="alertas form-label">
                  Estado
                </label>
                <select
                  className="alertas form-select"
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value as EstadoAlerta})}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en-proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="alertas form-actions">
              <button 
                className="alertas btn-cancelar"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('ver');
                }}
              >
                <FiX />
                <span>Cancelar</span>
              </button>
              
              <button 
                className="alertas btn-guardar"
                onClick={isEditing ? handleUpdateAlerta : handleCreateAlerta}
              >
                <FiSave />
                <span>{isEditing ? 'Actualizar Alerta' : 'Crear Alerta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}