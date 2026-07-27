// pages/Anomalias/Anomalias.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Anomalias.css';
import { apiRequest, ApiError } from '../../services/api';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiFileText,
  FiX,
  FiSave,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const ITEMS_POR_PAGINA = 10;

// Estados reales que maneja el backend (src/Fallas/domain/entities/anomalia.go)
type EstadoAnomalia = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA';

// Tal como responde GET/POST/PUT /api/anomalias/
// (src/Fallas/domain/entities/anomalia.go). OJO: el campo es "conductor_id",
// no "id_chofer_id" -- con el nombre viejo el PUT nunca mandaba este dato,
// y como el UPDATE del backend reemplaza la columna completa, cada guardado
// desde esta pantalla borraba el conductor_id real de la anomalía.
interface Anomalia {
  anomalia_id: number;
  punto_id: number | null;
  tipo_anomalia: string;
  descripcion: string;
  fecha_reporte: string;
  estado: EstadoAnomalia;
  fecha_resolucion: string | null;
  conductor_id: number | null;
  // Resultado del pipeline modelo_reportes -> clasificador_reportes,
  // se llena solo (async) al crear la anomalía.
  estado_pipeline?: string;
  nivel_riesgo?: string | null;
  categoria_clasificada?: string | null;
  subtipo_clasificado?: string | null;
  accion_sugerida?: string | null;
  pipeline_error?: string | null;
}

interface AnomaliaPayload {
  punto_id: number | null;
  tipo_anomalia: string;
  descripcion: string;
  fecha_reporte: string;
  estado: EstadoAnomalia;
  fecha_resolucion: string | null;
  conductor_id: number | null;
}

function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function Anomalias() {
  const navigate = useNavigate();

  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [selectedAnomalia, setSelectedAnomalia] = useState<Anomalia | null>(null);
  const [modalEstado, setModalEstado] = useState<EstadoAnomalia>('PENDIENTE');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);

  async function loadAnomalias() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: Anomalia[] }>('/api/anomalias/');
      setAnomalias(response.data ?? []);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las anomalías.'));
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnomalias();
  }, []);

  const estadisticas = useMemo(
    () => ({
      total: anomalias.length,
      pendientes: anomalias.filter((a) => a.estado === 'PENDIENTE').length,
      enProceso: anomalias.filter((a) => a.estado === 'EN_PROCESO').length,
      resueltas: anomalias.filter((a) => a.estado === 'RESUELTA').length,
    }),
    [anomalias]
  );

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'RESUELTA':
        return <FiCheckCircle />;
      case 'EN_PROCESO':
        return <FiClock />;
      default:
        return <FiAlertCircle />;
    }
  };

  const getEstadoLabel = (estado: string) =>
    estado === 'RESUELTA' ? 'Resuelta' : estado === 'EN_PROCESO' ? 'En proceso' : 'Pendiente';

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const anomaliasFiltradas = anomalias.filter((item) => {
    if (selectedEstado !== 'todos' && item.estado !== selectedEstado) return false;
    if (
      searchTerm &&
      !item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.tipo_anomalia.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(anomaliasFiltradas.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const anomaliasPagina = anomaliasFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  useEffect(() => {
    setPagina(1);
  }, [selectedEstado, searchTerm]);

  const handleOpenModal = (anomalia: Anomalia) => {
    setSelectedAnomalia(anomalia);
    setModalEstado(anomalia.estado);
    setMostrarModal(true);
  };

  const handleGuardarEstado = async () => {
    if (!selectedAnomalia) return;

    setSaving(true);
    setError(null);

    const payload: AnomaliaPayload = {
      punto_id: selectedAnomalia.punto_id,
      tipo_anomalia: selectedAnomalia.tipo_anomalia,
      descripcion: selectedAnomalia.descripcion,
      fecha_reporte: selectedAnomalia.fecha_reporte,
      estado: modalEstado,
      fecha_resolucion: modalEstado === 'RESUELTA' ? new Date().toISOString() : null,
      conductor_id: selectedAnomalia.conductor_id,
    };

    try {
      await apiRequest(`/api/anomalias/${selectedAnomalia.anomalia_id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setMostrarModal(false);
      await loadAnomalias();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar la anomalía.'));
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="anomalias-page">
      <div className="anomalias">
        <header className="anomalias-header">
          <div className="anomalias header-content">
            <div className="anomalias header-title">
              <h1>Gestión de Anomalías</h1>
              <p className="anomalias subtitle">Reportes y seguimiento de incidentes en puntos de recolección</p>
            </div>

            <div className="anomalias stats-container">
              <div className="anomalias stat-card">
                <div className="anomalias stat-icon-1">
                  <FiAlertTriangle />
                </div>
                <div>
                  <span className="anomalias stat-value">{estadisticas.total}</span>
                  <span className="anomalias stat-label">Anomalías totales</span>
                </div>
              </div>

              <div className="anomalias stat-card">
                <div className="anomalias stat-icon-2">
                  <FiAlertCircle />
                </div>
                <div>
                  <span className="anomalias stat-value">{estadisticas.pendientes}</span>
                  <span className="anomalias stat-label">Pendientes</span>
                </div>
              </div>

              <div className="anomalias stat-card">
                <div className="anomalias stat-icon-3">
                  <FiClock />
                </div>
                <div>
                  <span className="anomalias stat-value">{estadisticas.enProceso}</span>
                  <span className="anomalias stat-label">En proceso</span>
                </div>
              </div>

              <div className="anomalias stat-card">
                <div className="anomalias stat-icon-4">
                  <FiCheckCircle />
                </div>
                <div>
                  <span className="anomalias stat-value">{estadisticas.resueltas}</span>
                  <span className="anomalias stat-label">Resueltas</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="anomalias controls-container">
          <div className="anomalias search-container">
            <FiSearch className="anomalias search-icon" />
            <input
              type="text"
              placeholder="Buscar por tipo o descripción..."
              className="anomalias search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="anomalias filters-row">
            <div className="anomalias filter-group">
              <label className="anomalias filter-label">
                <FiFilter />
                <span>Estado:</span>
              </label>
              <select
                className="anomalias filter-select"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="RESUELTA">Resuelta</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="anomalias controls-container" style={{ color: '#e74c3c', padding: '8px 16px' }}>
            {error}
          </div>
        )}

        <div className="anomalias table-container">
          <div className="anomalias table-header">
            <div className="anomalias table-summary">
              Mostrando {anomaliasFiltradas.length} de {anomalias.length} anomalías
            </div>
          </div>

          <div className="anomalias table-wrapper">
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center' }}>Cargando anomalías...</div>
            ) : (
              <table className="anomalias anomalias-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo / Descripción</th>
                    <th>Fecha reporte</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {anomaliasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                        No hay anomalías para mostrar.
                      </td>
                    </tr>
                  ) : (
                    anomaliasPagina.map((item) => (
                      <tr key={item.anomalia_id} className="anomalias table-row">
                        <td>#{item.anomalia_id}{item.punto_id ? ` · Punto ${item.punto_id}` : ''}</td>
                        <td>
                          <div className="anomalias descripcion">
                            <b style={{ textTransform: 'capitalize' }}>{item.tipo_anomalia}</b>
                            <div>{item.descripcion}</div>
                          </div>
                        </td>
                        <td>{formatFecha(item.fecha_reporte)}</td>
                        <td>
                          <div className={`anomalias estado-badge anomalias estado-${item.estado.toLowerCase()}`}>
                            {getEstadoIcon(item.estado)}
                            <span>{getEstadoLabel(item.estado)}</span>
                          </div>
                        </td>
                        <td>
                          <button className="anomalias btn-detalles" onClick={() => handleOpenModal(item)}>
                            <FiEye />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && totalPaginas > 1 && (
            <div className="anomalias table-pagination">
              <button
                type="button"
                className="anomalias pagination-btn"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                <FiChevronLeft />
                <span>Anterior</span>
              </button>

              <span className="anomalias pagination-info">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                type="button"
                className="anomalias pagination-btn"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                <span>Siguiente</span>
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* Modal de detalle / cambio de estado */}
        <div className={`anomalias modal-overlay ${mostrarModal ? 'show' : ''}`}>
          <div className="anomalias modal" onClick={(e) => e.stopPropagation()}>
            <div className="anomalias modal-header">
              <h2 className="anomalias modal-title">
                <FiAlertTriangle />
                <span>Detalles de Anomalía</span>
              </h2>
              <button className="anomalias modal-close" onClick={() => setMostrarModal(false)}>
                <FiX />
              </button>
            </div>

            {selectedAnomalia && (
              <>
                <div className="anomalias modal-info">
                  <div>
                    <div className="anomalias modal-label">
                      <FiMapPin />
                      <span>Punto:</span>
                    </div>
                    <div>{selectedAnomalia.punto_id ?? 'Sin punto asociado'}</div>
                  </div>

                  <div>
                    <div className="anomalias modal-label">
                      <FiCalendar />
                      <span>Fecha reporte:</span>
                    </div>
                    <div>{formatFecha(selectedAnomalia.fecha_reporte)}</div>
                  </div>

                  <div>
                    <div className="anomalias modal-label">
                      <FiCalendar />
                      <span>Fecha resolución:</span>
                    </div>
                    <div>{formatFecha(selectedAnomalia.fecha_resolucion)}</div>
                  </div>
                </div>

                <div className="anomalias modal-section">
                  <label className="anomalias modal-label">
                    <FiFileText />
                    <span>Descripción</span>
                  </label>
                  <div className="anomalias modal-textarea" style={{ minHeight: 60 }}>
                    {selectedAnomalia.descripcion}
                  </div>
                </div>

                {selectedAnomalia.estado_pipeline && (
                  <div className="anomalias modal-section">
                    <label className="anomalias modal-label">Clasificación automática</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 12, background: '#f1f2f6' }}>
                        Pipeline: {selectedAnomalia.estado_pipeline}
                      </span>
                      {selectedAnomalia.nivel_riesgo && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            background:
                              selectedAnomalia.nivel_riesgo === 'alto'
                                ? '#fdecea'
                                : selectedAnomalia.nivel_riesgo === 'medio'
                                ? '#fff4e0'
                                : '#eafaf1',
                            color:
                              selectedAnomalia.nivel_riesgo === 'alto'
                                ? '#e74c3c'
                                : selectedAnomalia.nivel_riesgo === 'medio'
                                ? '#c78a1e'
                                : '#27ae60',
                          }}
                        >
                          Riesgo: {selectedAnomalia.nivel_riesgo}
                        </span>
                      )}
                      {selectedAnomalia.categoria_clasificada && (
                        <span style={{ padding: '4px 10px', borderRadius: 12, background: '#f1f2f6' }}>
                          Categoría: {selectedAnomalia.categoria_clasificada}
                          {selectedAnomalia.subtipo_clasificado ? ` / ${selectedAnomalia.subtipo_clasificado}` : ''}
                        </span>
                      )}
                      {selectedAnomalia.accion_sugerida && (
                        <span style={{ padding: '4px 10px', borderRadius: 12, background: '#f1f2f6' }}>
                          Acción sugerida: {selectedAnomalia.accion_sugerida}
                        </span>
                      )}
                      {selectedAnomalia.pipeline_error && (
                        <span style={{ padding: '4px 10px', borderRadius: 12, background: '#fdecea', color: '#e74c3c' }}>
                          Error: {selectedAnomalia.pipeline_error}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="anomalias modal-section">
                  <label className="anomalias modal-label">Actualizar estado</label>
                  <select
                    className="anomalias modal-select"
                    value={modalEstado}
                    onChange={(e) => setModalEstado(e.target.value as EstadoAnomalia)}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN_PROCESO">En proceso</option>
                    <option value="RESUELTA">Resuelta</option>
                  </select>
                </div>

                <div className="anomalias modal-footer">
                  <button
                    className="anomalias modal-btn anomalias modal-btn-secondary"
                    onClick={() => setMostrarModal(false)}
                  >
                    <FiX />
                    <span>Cancelar</span>
                  </button>
                  <button className="anomalias modal-btn anomalias modal-btn-primary" onClick={handleGuardarEstado} disabled={saving}>
                    <FiSave />
                    <span>{saving ? 'Guardando...' : 'Guardar'}</span>
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
