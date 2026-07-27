// pages/Historial/Historial.tsx
import { useEffect, useMemo, useState } from 'react';
import './Historial.css';
import {
  FiSearch,
  FiX,
  FiTruck,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const ITEMS_POR_PAGINA = 10;
import { apiRequest, getRole } from '../../services/api';
import { ROLES } from '../../services/auth';
import AsignacionForm from './components/AsignacionForm';
import AsignacionTable from './components/AsignacionTable';

// Catalogos minimos que necesita esta pantalla para mostrar placa/nombre en
// lugar de solo ids. No son el modelo completo de Camion/Empleado (ver
// CamionesPage.tsx / EmpleadosPage.tsx), solo lo que hace falta aqui.
export interface Camion {
  camion_id: number;
  placa: string;
}

// "Conductor" es el nombre que usamos en esta pantalla para los empleados
// con rol_id === ROLES.CONDUCTOR (core/roles.go). El backend los expone
// dentro del mismo listado que /api/empleados/, no en un endpoint aparte.
export interface Conductor {
  id: number;
  nombre: string;
}

// Coincide con lo que pide/devuelve el backend en /api/historial-asignacion/:
// { fecha_asignacion, fecha_baja, id_camion, id_chofer, id_historial }
// (el nombre de campo "id_chofer" es del backend; en el frontend lo tratamos
// como "conductor" nada mas para la UI).
export interface HistorialAsignacion {
  id_historial: number;
  id_camion: number;
  id_chofer: number;
  fecha_asignacion: string;
  fecha_baja: string;
}

export interface AsignacionPayload {
  id_camion: number;
  id_chofer: number;
  fecha_asignacion: string;
  fecha_baja: string;
}

function normalizarAsignacion(raw: unknown): HistorialAsignacion {
  const s = raw as Record<string, unknown>;
  return {
    id_historial: Number(s.id_historial ?? 0),
    id_camion: Number(s.id_camion ?? 0),
    id_chofer: Number(s.id_chofer ?? 0),
    fecha_asignacion: typeof s.fecha_asignacion === 'string' ? s.fecha_asignacion : '',
    fecha_baja: typeof s.fecha_baja === 'string' ? s.fecha_baja : '',
  };
}

function normalizarConductor(raw: unknown): Conductor {
  const s = raw as Record<string, unknown>;
  const id = Number(s.id ?? 0);
  return {
    id,
    nombre: typeof s.nombre === 'string' && s.nombre.length > 0 ? s.nombre : `Conductor #${id}`,
  };
}

export default function Historial() {
  const [asignaciones, setAsignaciones] = useState<HistorialAsignacion[]>([]);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogWarning, setCatalogWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedCamion, setSelectedCamion] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'activa' | 'finalizada'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modoForm, setModoForm] = useState<'CREAR' | 'EDITAR'>('CREAR');
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState<HistorialAsignacion | null>(null);

  // Conductor: solo puede consultar el historial (sin botones de escritura).
  const isConductor = getRole() === ROLES.CONDUCTOR;

  // /api/empleados/ requiere rol ADMIN exclusivamente (ver auth_routes.go).
  // Cualquier otro rol (Coordinador, Operador, Conductor) recibe 403 al
  // intentar listar empleados, asi que ninguno de ellos puede armar el
  // catalogo de conductores: no tiene sentido pedirlo ni mostrar el filtro.
  const canListEmpleados = getRole() === ROLES.ADMIN;

  async function loadAsignaciones() {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ data: unknown[] }>('/api/historial-asignacion/');
      setAsignaciones((response.data ?? []).map(normalizarAsignacion));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial de asignacion.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCamiones() {
    try {
      const response = await apiRequest<{ data: Camion[] }>('/api/camion/');
      setCamiones(response.data ?? []);
    } catch (err) {
      // Catalogo secundario: no bloquea la pantalla, pero avisamos por que
      // el select de camion puede aparecer vacio (ej. 403 por rol).
      setCatalogWarning((prev) =>
        prev ?? `No se pudieron cargar los camiones: ${err instanceof Error ? err.message : 'error desconocido'}.`
      );
    }
  }

  async function loadConductores() {
    try {
      const response = await apiRequest<{ data: unknown[] }>('/api/empleados/');
      // rol_id === ROLES.CONDUCTOR (core/roles.go). Los conductores de una
      // asignacion siempre son empleados con este rol.
      const soloConductores = response.data.filter(
        (u) => (u as Record<string, unknown>).rol_id === ROLES.CONDUCTOR
      );
      setConductores(soloConductores.map(normalizarConductor));
    } catch (err) {
      // /api/empleados/ requiere rol ADMIN (ver INFORME_CONEXION_API.md).
      // Si la cuenta logueada no es ADMIN, este fetch falla y antes se
      // ignoraba en silencio, por eso el select de conductor parecia vacio
      // aunque si existieran conductores dados de alta.
      setCatalogWarning(
        `No se pudieron cargar los conductores: ${err instanceof Error ? err.message : 'error desconocido'}. ` +
          `/api/empleados/ requiere rol ADMIN; si tu cuenta tiene otro rol, pide a un admin que los cargue o que se abra el permiso.`
      );
    }
  }

  useEffect(() => {
    void loadAsignaciones();
    void loadCamiones();
    // Solo ADMIN tiene permiso para /api/empleados/: no tiene sentido
    // pedirlo para otros roles solo para que falle y muestre una advertencia.
    if (canListEmpleados) {
      void loadConductores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPlaca = (id_camion: number) =>
    camiones.find((c) => c.camion_id === id_camion)?.placa ?? `Camion #${id_camion}`;

  const getConductorNombre = (id_chofer: number) =>
    conductores.find((c) => c.id === id_chofer)?.nombre ?? `Conductor #${id_chofer}`;

  const handleFilterClick = (filter: 'todos' | 'activa' | 'finalizada') => {
    setActiveFilter(filter);
  };

  const handleLimpiarFiltros = () => {
    setSelectedCamion('');
    setSelectedConductor('');
    setActiveFilter('todos');
    setSearchTerm('');
  };

  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter((item) => {
      const estado = item.fecha_baja ? 'finalizada' : 'activa';
      if (activeFilter !== 'todos' && estado !== activeFilter) return false;

      if (selectedCamion && String(item.id_camion) !== selectedCamion) return false;
      if (selectedConductor && String(item.id_chofer) !== selectedConductor) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const placa = getPlaca(item.id_camion).toLowerCase();
        const conductor = getConductorNombre(item.id_chofer).toLowerCase();
        if (!placa.includes(q) && !conductor.includes(q)) return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asignaciones, activeFilter, selectedCamion, selectedConductor, searchTerm, camiones, conductores]);

  const totalPaginas = Math.max(1, Math.ceil(asignacionesFiltradas.length / ITEMS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const asignacionesPagina = asignacionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA,
  );

  useEffect(() => {
    setPagina(1);
  }, [activeFilter, selectedCamion, selectedConductor, searchTerm]);

  const resumen = useMemo(() => {
    const total = asignaciones.length;
    const activas = asignaciones.filter((a) => !a.fecha_baja).length;
    return { total, activas, finalizadas: total - activas };
  }, [asignaciones]);

  function abrirCrear() {
    setModoForm('CREAR');
    setAsignacionSeleccionada(null);
    setModalOpen(true);
  }

  function abrirEditar(asignacion: HistorialAsignacion) {
    setModoForm('EDITAR');
    setAsignacionSeleccionada(asignacion);
    setModalOpen(true);
  }

  function cerrarModal() {
    setModalOpen(false);
  }

  async function onSubmitForm(data: AsignacionPayload) {
    setSaving(true);
    setError(null);

    try {
      if (modoForm === 'CREAR') {
        await apiRequest('/api/historial-asignacion/', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else if (asignacionSeleccionada) {
        await apiRequest(`/api/historial-asignacion/${asignacionSeleccionada.id_historial}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }

      setModalOpen(false);
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la asignacion.');
    } finally {
      setSaving(false);
    }
  }

  async function darDeBaja(asignacion: HistorialAsignacion) {
    const ok = confirm(
      `Dar de baja la asignacion de ${getConductorNombre(asignacion.id_chofer)} en ${getPlaca(asignacion.id_camion)}?`
    );
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/historial-asignacion/${asignacion.id_historial}`, {
        method: 'PUT',
        body: JSON.stringify({
          id_camion: asignacion.id_camion,
          id_chofer: asignacion.id_chofer,
          fecha_asignacion: asignacion.fecha_asignacion,
          fecha_baja: new Date().toISOString().slice(0, 10),
        }),
      });
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo dar de baja la asignacion.');
    } finally {
      setSaving(false);
    }
  }

  async function eliminarAsignacion(id_historial: number) {
    const ok = confirm('Seguro que deseas eliminar esta asignacion del historial?');
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(`/api/historial-asignacion/${id_historial}`, { method: 'DELETE' });
      await loadAsignaciones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la asignacion.');
    } finally {
      setSaving(false);
    }
  }

  const formatFecha = (fecha: string) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="historial-container">
      <div className="historial">
        {/* Seccion 1: Header con estadisticas */}
        <header className="historial-header">
          <div className="historial header-content">
            <div className="historial header-title">
              <h1>Historial de Asignacion</h1>
              <p className="historial subtitle">Conductores asignados a cada camion, con fecha de alta y baja</p>
            </div>

            <div className="historial header-stats">
              <div className="historial stat-card">
                <div className="historial stat-icon">
                  <FiTruck />
                </div>
                <div>
                  <span className="historial stat-value">{resumen.total}</span>
                  <span className="historial stat-label">Asignaciones totales</span>
                </div>
              </div>

              <div className="historial stat-card">
                <div className="historial stat-icon">
                  <FiCheckCircle />
                </div>
                <div>
                  <span className="historial stat-value">{resumen.activas}</span>
                  <span className="historial stat-label">Activas</span>
                </div>
              </div>

              <div className="historial stat-card">
                <div className="historial stat-icon">
                  <FiClock />
                </div>
                <div>
                  <span className="historial stat-value">{resumen.finalizadas}</span>
                  <span className="historial stat-label">Finalizadas</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Seccion 2: Filtros + accion de crear */}
        <div className="historial filtros-container">
          <div className="historial filtros-header">
            <h3 className="historial filtros-title">Filtros de Asignacion</h3>
            <div className="historial filtros-header-actions">
              <button className="historial btn-limpiar" onClick={handleLimpiarFiltros}>
                <FiX />
                <span>Limpiar todos</span>
              </button>
              {!isConductor && (
                <button className="historial btn-nueva" onClick={abrirCrear} disabled={saving}>
                  <FiPlus />
                  <span>Nueva asignacion</span>
                </button>
              )}
            </div>
          </div>

          <div className="historial filtros-grid">
            {/* Filtro por camion */}
            <div className="historial filtro-group">
              <div className="historial filtro-label">
                <FiTruck />
                <span>Camion:</span>
              </div>
              <select
                className="historial filtro-select"
                value={selectedCamion}
                onChange={(e) => setSelectedCamion(e.target.value)}
              >
                <option value="">Todos los camiones</option>
                {camiones.map((c) => (
                  <option key={c.camion_id} value={c.camion_id}>
                    {c.placa}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por conductor: solo ADMIN tiene permiso para listar
                /api/empleados/, asi que solo a ese rol tiene sentido
                mostrarle este filtro. */}
            {canListEmpleados && (
            <div className="historial filtro-group">
              <div className="historial filtro-label">
                <FiUser />
                <span>Conductor:</span>
              </div>
              <select
                className="historial filtro-select"
                value={selectedConductor}
                onChange={(e) => setSelectedConductor(e.target.value)}
              >
                <option value="">Todos los conductores</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            )}

            {/* Filtros rapidos por estado */}
            <div className="historial filtro-group historial full-width">
              <div className="historial filtro-label">
                <span>Estado:</span>
              </div>
              <div className="historial filtros-rapidos">
                <button
                  className={`historial quick-filter-btn ${activeFilter === 'todos' ? 'historial active' : ''}`}
                  onClick={() => handleFilterClick('todos')}
                >
                  Todos
                </button>
                <button
                  className={`historial quick-filter-btn ${activeFilter === 'activa' ? 'historial active' : ''}`}
                  onClick={() => handleFilterClick('activa')}
                >
                  <FiCheckCircle />
                  Activas
                </button>
                <button
                  className={`historial quick-filter-btn ${activeFilter === 'finalizada' ? 'historial active' : ''}`}
                  onClick={() => handleFilterClick('finalizada')}
                >
                  <FiClock />
                  Finalizadas
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="historial form-error">{error}</div>}
        {catalogWarning && <div className="historial form-warning">{catalogWarning}</div>}

        {/* Seccion 3: Tabla de datos */}
        <div className="historial table-container">
          <div className="historial table-header">
            <div className="historial table-summary">
              Mostrando {asignacionesFiltradas.length} de {asignaciones.length} asignaciones
            </div>
            <div className="historial table-search">
              <FiSearch className="historial search-icon" />
              <input
                type="text"
                placeholder="Buscar por camion o conductor..."
                className="historial search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="historial empty-state">Cargando historial de asignacion...</div>
          ) : (
            <AsignacionTable
              asignaciones={asignacionesPagina}
              getPlaca={getPlaca}
              getConductorNombre={getConductorNombre}
              formatFecha={formatFecha}
              onEditar={abrirEditar}
              onDarDeBaja={darDeBaja}
              onEliminar={eliminarAsignacion}
              readOnly={isConductor}
            />
          )}

          {!loading && totalPaginas > 1 && (
            <div className="historial table-pagination">
              <button
                type="button"
                className="historial pagination-btn"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
              >
                <FiChevronLeft />
                <span>Anterior</span>
              </button>

              <span className="historial pagination-info">
                Página {paginaActual} de {totalPaginas}
              </span>

              <button
                type="button"
                className="historial pagination-btn"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
              >
                <span>Siguiente</span>
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {modalOpen && (
          <div className="historial modal-overlay" onMouseDown={cerrarModal}>
            <div className="historial modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="historial modal-header">
                <h2>{modoForm === 'CREAR' ? 'Nueva asignacion' : 'Editar asignacion'}</h2>
                <button className="historial modal-close" onClick={cerrarModal}>
                  X
                </button>
              </div>

              <AsignacionForm
                key={asignacionSeleccionada?.id_historial ?? 'new'}
                modo={modoForm}
                asignacion={asignacionSeleccionada}
                camiones={camiones}
                conductores={conductores}
                saving={saving}
                onCancel={cerrarModal}
                onSubmit={onSubmitForm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
