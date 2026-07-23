// pages/EstadoRuta/EstadoRuta.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EstadoRuta.css';
import { apiRequest, ApiError } from '../../services/api';
import {
  FiMapPin,
  FiCheckCircle,
  FiPauseCircle,
  FiSearch,
  FiDownload,
  FiTruck,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiX,
  FiList,
} from 'react-icons/fi';

// Tal como responde GET /api/rutas/ (envuelto en { success, data })
interface Ruta {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  eliminado: boolean;
  created_at: string;
}

// Tal como responde GET/POST/PUT /api/puntos-recoleccion/
interface PuntoRecoleccion {
  punto_id: number;
  ruta_id: number;
  cp: string;
  eliminado: boolean;
  created_at: string;
}

interface PuntoPayload {
  ruta_id: number;
  cp: string;
  eliminado: boolean;
}

function mensajeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function EstadoRuta() {
  const navigate = useNavigate();

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [puntos, setPuntos] = useState<PuntoRecoleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedRutaId, setSelectedRutaId] = useState<number | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ver' | 'crear'>('ver');

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCp, setFormCp] = useState('');
  const [formRutaId, setFormRutaId] = useState<number | null>(null);
  const [formEliminado, setFormEliminado] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [rutasRes, puntosRes] = await Promise.all([
        apiRequest<{ success: boolean; data: Ruta[] }>('/rutas/'),
        apiRequest<{ data: PuntoRecoleccion[] }>('/puntos-recoleccion/'),
      ]);

      setRutas(rutasRes.data ?? []);
      setPuntos(puntosRes.data ?? []);

      if ((rutasRes.data ?? []).length > 0 && formRutaId === null) {
        setFormRutaId(rutasRes.data[0].ruta_id);
      }
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las rutas y puntos.'));
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreRuta = (rutaId: number) => rutas.find((r) => r.ruta_id === rutaId)?.nombre ?? `Ruta ${rutaId}`;

  const estadisticas = useMemo(() => {
    const total = puntos.length;
    const activos = puntos.filter((p) => !p.eliminado).length;
    const inactivos = puntos.filter((p) => p.eliminado).length;
    return { total, activos, inactivos };
  }, [puntos]);

  const puntosFiltrados = puntos.filter((punto) => {
    if (selectedRutaId !== 'todas' && punto.ruta_id !== selectedRutaId) return false;
    if (searchTerm && !punto.cp.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleResetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormCp('');
    setFormEliminado(false);
    setFormRutaId(rutas[0]?.ruta_id ?? null);
  };

  const handleEditPunto = (punto: PuntoRecoleccion) => {
    setActiveTab('crear');
    setIsEditing(true);
    setEditingId(punto.punto_id);
    setFormCp(punto.cp);
    setFormRutaId(punto.ruta_id);
    setFormEliminado(punto.eliminado);
  };

  const handleDeletePunto = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este punto?')) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/puntos-recoleccion/${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el punto.'));
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCp.trim() || !formRutaId) {
      alert('Por favor completa el código postal y selecciona una ruta.');
      return;
    }

    const payload: PuntoPayload = {
      ruta_id: formRutaId,
      cp: formCp.trim(),
      eliminado: formEliminado,
    };

    setSaving(true);
    setError(null);

    try {
      if (isEditing && editingId) {
        await apiRequest(`/puntos-recoleccion/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/puntos-recoleccion/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      handleResetForm();
      setActiveTab('ver');
      await loadAll();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el punto de recolección.'));
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Ruta', 'CP', 'Estado'];
    const rows = puntosFiltrados.map((p) => [p.punto_id, nombreRuta(p.ruta_id), p.cp, p.eliminado ? 'Inactivo' : 'Activo']);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'puntos_recoleccion.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="estado-ruta-container">
      <div className="estado-ruta">
        <header className="estado-ruta-header">
          <div className="estado-ruta header-content">
            <div className="estado-ruta header-title">
              <h1>Puntos de Ruta</h1>
              <p className="estado-ruta subtitle">Administración y seguimiento de puntos de recolección por ruta</p>
            </div>

            <div className="estado-ruta header-stats">
              <div className="estado-ruta stat-card">
                <div className="estado-ruta stat-icon" style={{ backgroundColor: 'rgba(238, 244, 245, 0.85)' }}>
                  <FiMapPin />
                </div>
                <div>
                  <span className="estado-ruta stat-value">{estadisticas.total}</span>
                  <span className="estado-ruta stat-label">Puntos totales</span>
                </div>
              </div>

              <div className="estado-ruta stat-card">
                <div className="estado-ruta stat-icon" style={{ backgroundColor: 'rgba(15, 236, 107, 0.94)' }}>
                  <FiCheckCircle />
                </div>
                <div>
                  <span className="estado-ruta stat-value">{estadisticas.activos}</span>
                  <span className="estado-ruta stat-label">Activos</span>
                </div>
              </div>

              <div className="estado-ruta stat-card">
                <div className="estado-ruta stat-icon" style={{ backgroundColor: 'rgba(192, 241, 15, 0.9)' }}>
                  <FiPauseCircle />
                </div>
                <div>
                  <span className="estado-ruta stat-value">{estadisticas.inactivos}</span>
                  <span className="estado-ruta stat-label">Inactivos</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="estado-ruta tabs-navigation">
          <div className="estado-ruta tabs-container">
            <button
              className={`estado-ruta tab-btn ${activeTab === 'ver' ? 'active' : ''}`}
              onClick={() => setActiveTab('ver')}
            >
              <FiList />
              <span>Ver Puntos</span>
            </button>
            <button
              className={`estado-ruta tab-btn ${activeTab === 'crear' ? 'active' : ''}`}
              onClick={() => setActiveTab('crear')}
            >
              <FiPlus />
              <span>{isEditing ? 'Editar Punto' : 'Crear Punto'}</span>
            </button>
          </div>
        </div>

        {error && <div style={{ color: '#e74c3c', padding: '8px 16px' }}>{error}</div>}

        {activeTab === 'ver' && (
          <>
            <div className="estado-ruta controles-panel">
              <div className="estado-ruta controles-left">
                <div className="estado-ruta ruta-selector">
                  <label className="estado-ruta selector-label">
                    <FiTruck />
                    <span>Seleccionar ruta:</span>
                  </label>
                  <select
                    className="estado-ruta selector-input"
                    value={selectedRutaId}
                    onChange={(e) => setSelectedRutaId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                  >
                    <option value="todas">Todas las rutas</option>
                    {rutas.map((ruta) => (
                      <option key={ruta.ruta_id} value={ruta.ruta_id}>
                        {ruta.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="estado-ruta controles-right">
                <div className="estado-ruta search-container">
                  <FiSearch className="estado-ruta search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar por código postal..."
                    className="estado-ruta search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <button className="estado-ruta action-btn" onClick={handleExport}>
                  <FiDownload />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="estado-ruta table-container">
              <div className="estado-ruta table-header">
                <div className="estado-ruta table-summary">Mostrando {puntosFiltrados.length} puntos</div>
              </div>

              <div className="estado-ruta table-wrapper">
                {loading ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>Cargando puntos de recolección...</div>
                ) : (
                  <table className="estado-ruta estado-ruta-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Ruta</th>
                        <th>Código Postal</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puntosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                            No hay puntos de recolección para mostrar.
                          </td>
                        </tr>
                      ) : (
                        puntosFiltrados.map((punto) => (
                          <tr key={punto.punto_id} className="estado-ruta table-row">
                            <td>#{punto.punto_id}</td>
                            <td className="estado-ruta direccion-cell">
                              <FiMapPin />
                              <span>{nombreRuta(punto.ruta_id)}</span>
                            </td>
                            <td>{punto.cp}</td>
                            <td className="estado-ruta estado-cell">
                              <div className={`estado-ruta estado-badge estado-${punto.eliminado ? 'inactivo' : 'activo'}`}>
                                {punto.eliminado ? <FiPauseCircle /> : <FiCheckCircle />}
                                <span>{punto.eliminado ? 'Inactivo' : 'Activo'}</span>
                              </div>
                            </td>
                            <td className="estado-ruta acciones-cell">
                              <button className="estado-ruta btn-editar" onClick={() => handleEditPunto(punto)}>
                                <FiEdit2 />
                                <span>Editar</span>
                              </button>
                              <button
                                className="estado-ruta btn-eliminar"
                                onClick={() => void handleDeletePunto(punto.punto_id)}
                                disabled={saving}
                              >
                                <FiTrash2 />
                                <span>Eliminar</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'crear' && (
          <div className="estado-ruta crear-punto-container">
            <div className="estado-ruta crear-punto-form">
              <h2 className="estado-ruta form-title">
                {isEditing ? 'Editar Punto de Recolección' : 'Crear Nuevo Punto de Recolección'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="estado-ruta form-grid">
                  <div className="estado-ruta form-group full-width">
                    <label className="estado-ruta form-label">Ruta *</label>
                    <select
                      className="estado-ruta form-select"
                      value={formRutaId ?? ''}
                      onChange={(e) => setFormRutaId(Number(e.target.value))}
                    >
                      <option value="">Seleccione una ruta</option>
                      {rutas.map((ruta) => (
                        <option key={ruta.ruta_id} value={ruta.ruta_id}>
                          {ruta.nombre}
                        </option>
                      ))}
                    </select>
                    {rutas.length === 0 && (
                      <small className="estado-ruta form-hint">
                        No hay rutas cargadas todavía (o tu rol no tiene acceso a /api/rutas/).
                      </small>
                    )}
                  </div>

                  <div className="estado-ruta form-group full-width">
                    <label className="estado-ruta form-label">Código Postal *</label>
                    <input
                      type="text"
                      className="estado-ruta form-input"
                      value={formCp}
                      onChange={(e) => setFormCp(e.target.value)}
                      placeholder="Ej: 29000"
                    />
                  </div>

                  <div className="estado-ruta form-group">
                    <label className="estado-ruta form-label">Estado</label>
                    <select
                      className="estado-ruta form-select"
                      value={formEliminado ? 'inactivo' : 'activo'}
                      onChange={(e) => setFormEliminado(e.target.value === 'inactivo')}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="estado-ruta form-actions">
                  <button
                    type="button"
                    className="estado-ruta btn-cancelar"
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('ver');
                    }}
                  >
                    <FiX />
                    <span>Cancelar</span>
                  </button>

                  <button type="submit" className="estado-ruta btn-guardar" disabled={saving}>
                    <FiSave />
                    <span>{saving ? 'Guardando...' : isEditing ? 'Actualizar Punto' : 'Crear Punto'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
