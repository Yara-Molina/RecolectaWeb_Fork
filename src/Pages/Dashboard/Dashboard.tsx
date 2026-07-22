// Dashboard.tsx - Componente principal del dashboard de monitoreo de flota
import { useState, useEffect, useRef } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import camionRojo from '../../assets/camion-rojo.png';
import camionNaranja from '../../assets/camion-naranja.png';
import camionVerde from '../../assets/camion-verde.png';
import { apiRequest } from '../../services/api';
import { ROLES } from '../../services/auth';
import './Dashboard.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────
// Tal como responde GET /api/anomalias/ (ver Pages/Anomalias/Anomalias.tsx)
type EstadoAnomalia = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA';

interface Anomalia {
  anomalia_id: number;
  punto_id: number | null;
  tipo_anomalia: string;
  descripcion: string;
  fecha_reporte: string;
  estado: EstadoAnomalia;
}

interface Ruta {
  id: string;
  nombre: string;
  conductor: string;
  estado: 'alerta' | 'advertencia' | 'ok';
  progreso: number;
  color: string;
  badge: string;
}

// Catálogo mínimo de camiones para este dashboard (ver CamionesPage.tsx para
// el modelo completo y ESTADOS_DISPONIBILIDAD). Solo lo que hace falta para
// las métricas y la lista de camiones.
interface CamionDashboard {
  camion_id: number;
  placa: string;
  modelo: string;
  nombre_disponibilidad: string;
}

// Tal como responde GET /api/rutas/ (ver EstadoRuta.tsx). Nada que ver con la
// interfaz "Ruta" ficticia del mini-mapa.
interface RutaFiltro {
  ruta_id: number;
  nombre: string;
  eliminado: boolean;
}

// Tal como responde GET /api/ruta-camion/ (vínculo camión <-> ruta).
interface RutaCamionLink {
  ruta_camion_id: number;
  ruta_id: number;
  camion_id: number;
  eliminado: boolean;
}

// Tal como responde GET /api/historial-asignacion/ (ver Historial.tsx). Solo
// lo necesario para saber qué conductor tiene asignado cada camión hoy.
interface AsignacionActiva {
  id_camion: number;
  id_chofer: number;
  fecha_baja: string;
}

// Tal como responde GET /api/empleados/ (requiere rol ADMIN — ver
// Historial.tsx). Si la cuenta logueada no es ADMIN este fetch falla y el
// nombre del conductor simplemente se omite, sin bloquear el panel.
interface ConductorDashboard {
  id: number;
  nombre: string;
}

// Tal como responde GET /api/registro-vaciado/.
interface RegistroVaciadoDashboard {
  vaciado_id: number;
  relleno_id: number;
  ruta_camion_id: number;
  hora: string;
}

function estadoDeDisponibilidad(nombre: string): 'alerta' | 'advertencia' | 'ok' {
  if (nombre === 'OPERATIVO') return 'ok';
  if (nombre === 'MANTENIMIENTO') return 'advertencia';
  return 'alerta'; // FUERA_SERVICIO, BAJA
}

function labelDisponibilidad(nombre: string): string {
  switch (nombre) {
    case 'OPERATIVO': return 'Operativo';
    case 'MANTENIMIENTO': return 'Mantenimiento';
    case 'FUERA_SERVICIO': return 'Fuera de servicio';
    case 'BAJA': return 'Baja';
    default: return nombre || '—';
  }
}

interface Posiciones {
  [key: string]: { t: number };
}

// ─── Datos simulados ──────────────────────────────────────────────────────────

const RUTAS_INICIALES: Ruta[] = [
  { id: '01', nombre: 'Camión 1', conductor: '', estado: 'alerta',    progreso: 65,  color: '#E24B4A', badge: 'Detenido' },
  { id: '02', nombre: 'Camión 2', conductor: '', estado: 'advertencia', progreso: 40, color: '#BA7517', badge: 'En movimiento' },
  { id: '03', nombre: 'Camión 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },
];

// Rutas en el SVG (viewBox 460x220). Cada array = waypoints [x, y]
const MAP_PATHS: Record<string, number[][]> = {
  '01': [[20,56],[65,56],[65,116],[160,116],[220,56],[270,56]],
  '02': [[390,116],[270,116],[270,56],[165,56],[165,116],[65,116],[65,176]],
  '03': [[20,176],[65,176],[165,176],[270,176],[380,176],[450,176]],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function getTruckPos(path: number[][], t: number): [number, number] {
  const segs = path.length - 1;
  const seg  = Math.min(Math.floor(t * segs), segs - 1);
  const local = (t * segs) - seg;
  const a = path[seg], b = path[seg + 1];
  return [lerp(a[0], b[0], local), lerp(a[1], b[1], local)];
}

function buildPolylinePoints(path: number[][], t: number): string {
  if (t >= 1) return path.map(p => p.join(',')).join(' ');
  const segs = path.length - 1;
  const end  = t * segs;
  const seg  = Math.floor(end);
  const local = end - seg;
  const pts = path.slice(0, seg + 1).map(p => p.join(','));
  if (seg < path.length - 1) {
    const a = path[seg], b = path[seg + 1];
    pts.push([lerp(a[0], b[0], local).toFixed(1), lerp(a[1], b[1], local).toFixed(1)].join(','));
  }
  return pts.join(' ');
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

function formatFechaAnomalia(fecha: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function esHoy(fecha: string): boolean {
  const d = new Date(fecha);
  const hoy = new Date();
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
}

// ─── Mini mapa SVG ────────────────────────────────────────────────────────────

function MiniMapa({ rutas }: { rutas: Ruta[] }) {
  const [positions, setPositions] = useState<Posiciones>({
    '01': { t: RUTAS_INICIALES[0].progreso / 100 },
    '02': { t: RUTAS_INICIALES[1].progreso / 100 },
    '03': { t: RUTAS_INICIALES[2].progreso / 100 },
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function animate() {
      setPositions(prev => {
        const next = { ...prev };
        // Solo los camiones 02 y 03 se mueven en ciclo continuo
        // El camión 01 permanece en su posición inicial
        next['02'] = { t: (prev['02'].t + 0.0015) % 1 }; // Ciclo continuo
        next['03'] = { t: (prev['03'].t + 0.0012) % 1 }; // Ciclo continuo (velocidad ligeramente diferente)
        return next;
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const estadoColor: Record<string, string> = { alerta: '#E24B4A', advertencia: '#BA7517', ok: '#639922' };

  return (
    <div className="mapa-wrap">
      <svg viewBox="0 0 460 220" className="mapa-svg" xmlns="http://www.w3.org/2000/svg">
        {/* Fondo */}
        <rect width="460" height="220" fill="#e8eeea" />

        {/* Calles horizontales */}
        {[50, 110, 170].map(y => (
          <rect key={y} x="0" y={y} width="460" height="12" fill="#d4dcd6" opacity=".7" />
        ))}
        {/* Calles verticales */}
        {[60, 160, 270, 380].map(x => (
          <rect key={x} x={x} y="0" width="10" height="220" fill="#d4dcd6" opacity=".7" />
        ))}

        {/* Manzanas */}
        {[
          [10,20,40,25],[80,20,70,25],[80,65,70,38],[175,20,85,25],[175,65,85,38],
          [285,20,85,25],[285,65,85,38],[395,20,55,25],[80,125,70,38],[175,125,85,38],
          [285,125,85,38],[395,125,55,38],[10,185,40,28],[80,185,70,28],[175,185,85,28],
        ].map(([x,y,w,h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#c8d4ca" />
        ))}

        {/* Rutas trazadas */}
        {rutas.map(r => {
          const path = MAP_PATHS[r.id];
          const t    = positions[r.id]?.t ?? r.progreso / 100;
          const pts  = buildPolylinePoints(path, t);
          const color = estadoColor[r.estado] ?? '#888';
          return (
            <polyline
              key={r.id}
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeDasharray={r.estado === 'ok' ? 'none' : '5,3'}
              opacity=".85"
            />
          );
        })}

        {/* Camiones */}
        {rutas.map(r => {
          const path = MAP_PATHS[r.id];
          const t    = positions[r.id]?.t ?? r.progreso / 100;
          const [cx, cy] = getTruckPos(path, t);
          let camionImage = camionVerde;
          if (r.id === '01') camionImage = camionRojo;
          else if (r.id === '02') camionImage = camionNaranja;
          return (
            <image
              key={r.id}
              href={camionImage}
              x={cx - 12}
              y={cy - 8}
              width="24"
              height="16"
              opacity="0.9"
            />
          );
        })}
      </svg>

      {/* Leyenda */}
      <div className="mapa-legend">
        {rutas.map(r => (
          <div key={r.id} className="mapa-legend-row">
            <span className="mapa-legend-dot" style={{ background: estadoColor[r.estado] }} />
            <span>{r.nombre} · {r.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const [rutas]        = useState<Ruta[]>(RUTAS_INICIALES);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [ahora, setAhora]              = useState(new Date());

  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loadingAnomalias, setLoadingAnomalias] = useState(true);
  const [errorAnomalias, setErrorAnomalias] = useState<string | null>(null);

  const [camiones, setCamiones] = useState<CamionDashboard[]>([]);
  const [loadingCamiones, setLoadingCamiones] = useState(true);
  const [errorCamiones, setErrorCamiones] = useState<string | null>(null);

  const [rutasFiltro, setRutasFiltro] = useState<RutaFiltro[]>([]);
  const [rutaCamionLinks, setRutaCamionLinks] = useState<RutaCamionLink[]>([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<number | 'todas'>('todas');

  const [asignacionesActivas, setAsignacionesActivas] = useState<AsignacionActiva[]>([]);
  const [conductores, setConductores] = useState<ConductorDashboard[]>([]);

  const [vaciados, setVaciados] = useState<RegistroVaciadoDashboard[]>([]);

  useEffect(() => {
    const iv = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    async function loadAnomalias() {
      setLoadingAnomalias(true);
      setErrorAnomalias(null);

      try {
        const response = await apiRequest<{ data: Anomalia[] }>('/api/anomalias/');
        setAnomalias(response.data ?? []);
      } catch (err) {
        setErrorAnomalias(err instanceof Error ? err.message : 'No se pudieron cargar las anomalías.');
      } finally {
        setLoadingAnomalias(false);
      }
    }

    void loadAnomalias();
  }, []);

  useEffect(() => {
    async function loadCamiones() {
      setLoadingCamiones(true);
      setErrorCamiones(null);

      try {
        const response = await apiRequest<{ data: CamionDashboard[] }>('/api/camion/');
        setCamiones(response.data ?? []);
      } catch (err) {
        setErrorCamiones(err instanceof Error ? err.message : 'No se pudieron cargar los camiones.');
      } finally {
        setLoadingCamiones(false);
      }
    }

    void loadCamiones();
  }, []);

  useEffect(() => {
    async function loadRutasYVinculos() {
      try {
        const [rutasRes, links] = await Promise.all([
          apiRequest<{ success: boolean; data: RutaFiltro[] }>('/api/rutas/'),
          apiRequest<RutaCamionLink[]>('/api/ruta-camion/'),
        ]);
        setRutasFiltro(rutasRes.data ?? []);
        setRutaCamionLinks(links ?? []);
      } catch {
        // El filtro por ruta y el conteo de rutas activas son complementos:
        // si falla, esas secciones simplemente se quedan sin datos.
      }
    }

    void loadRutasYVinculos();
  }, []);

  useEffect(() => {
    async function loadAsignaciones() {
      try {
        const response = await apiRequest<{ data: AsignacionActiva[] }>('/api/historial-asignacion/');
        setAsignacionesActivas((response.data ?? []).filter(a => !a.fecha_baja));
      } catch {
        // Complemento del panel de camiones: si falla, simplemente no se
        // muestra el conductor asignado.
      }
    }

    async function loadConductores() {
      try {
        const response = await apiRequest<{ data: Record<string, unknown>[] }>('/api/empleados/');
        const soloConductores = (response.data ?? [])
          .filter((u) => u.rol_id === ROLES.CONDUCTOR)
          .map((u) => ({
            id: Number(u.id ?? 0),
            nombre: typeof u.nombre === 'string' && u.nombre ? u.nombre : `Conductor #${u.id}`,
          }));
        setConductores(soloConductores);
      } catch {
        // /api/empleados/ requiere rol ADMIN (ver Historial.tsx). Si la
        // cuenta logueada no lo es, se omite el nombre del conductor.
      }
    }

    void loadAsignaciones();
    void loadConductores();
  }, []);

  useEffect(() => {
    async function loadVaciados() {
      try {
        const vaciadosRes = await apiRequest<RegistroVaciadoDashboard[] | null>('/api/registro-vaciado/');
        setVaciados(vaciadosRes ?? []);
      } catch {
        // Complemento de la métrica "Vaciados hoy": si falla, se queda en 0.
      }
    }

    void loadVaciados();
  }, []);

  const metricas = {
    operativos:    camiones.filter(c => c.nombre_disponibilidad === 'OPERATIVO').length,
    mantenimiento: camiones.filter(c => c.nombre_disponibilidad === 'MANTENIMIENTO').length,
  };

  const estadoBadgeClass: Record<string, string> = { alerta: 'tbadge-err', advertencia: 'tbadge-warn', ok: 'tbadge-ok' };
  const estadoDotClass: Record<string, string>   = { alerta: 'sdot-err',  advertencia: 'sdot-warn',  ok: 'sdot-ok'  };

  const camionIdsDeRuta =
    rutaSeleccionada === 'todas'
      ? null
      : new Set(
          rutaCamionLinks
            .filter(v => v.ruta_id === rutaSeleccionada && !v.eliminado)
            .map(v => v.camion_id)
        );

  const camionesFiltrados = camionIdsDeRuta === null
    ? camiones
    : camiones.filter(c => camionIdsDeRuta.has(c.camion_id));

  function conductorDeCamion(camionId: number): string | null {
    const activa = asignacionesActivas.find(a => a.id_camion === camionId);
    if (!activa) return null;
    return conductores.find(c => c.id === activa.id_chofer)?.nombre ?? null;
  }

  const vaciadosHoy = vaciados.filter(v => esHoy(v.hora)).length;

  const rutasActivas = rutasFiltro.filter(r => !r.eliminado).length;

 // SOLO cambia la parte del render (return)

return (
  <div className="dash-container">
    <div className="dashboard">

      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div>
            <h1>Dashboard</h1>
            <p className="dash-subtitle">Turno matutino · Zona Norte</p>
          </div>
        </div>
        <div className="dash-clock">
          {pad(ahora.getHours())}:{pad(ahora.getMinutes())}:{pad(ahora.getSeconds())}
        </div>
      </header>

      {/* MÉTRICAS */}
      <div className="dash-metrics">
        <div className="metric">
          <span className="metric-lbl">Rutas</span>
          <span className="metric-val">{rutasActivas}</span>
          <span className="metric-lbl">activas</span>
        </div>
        <div className="metric">
          <span className="metric-lbl">Operativos</span>
          <span className="metric-val val-ok">{metricas.operativos}</span>
          <span className="metric-lbl">camiones</span>
        </div>
        <div className="metric">
          <span className="metric-lbl">En mantenimiento</span>
          <span className="metric-val val-info">{metricas.mantenimiento}</span>
          <span className="metric-lbl">camiones</span>
        </div>
        <div className="metric">
          <span className="metric-lbl">Vaciados</span>
          <span className="metric-val val-danger">{vaciadosHoy}</span>
          <span className="metric-lbl">hoy</span>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="dash-main-grid">

        {/* MAPA */}
        <div className="card">
          <h2 className="card-title">Mapa de rutas · Tiempo real</h2>
          <MiniMapa rutas={rutas} />
        </div>

        {/* COLUMNA DERECHA */}
        <div className="right-column">

          {/* CAMIONES */}
          <div className="card card--camiones">
            <div className="card-title-row">
              <h2 className="card-title">Camiones</h2>
              <select
                className="ruta-filter-select"
                value={rutaSeleccionada}
                onChange={(e) => setRutaSeleccionada(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
              >
                <option value="todas">Todas las rutas</option>
                {rutasFiltro.map(r => (
                  <option key={r.ruta_id} value={r.ruta_id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div className="truck-list truck-list--compact">
              {loadingCamiones ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>Cargando camiones...</p>
              ) : errorCamiones ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>{errorCamiones}</p>
              ) : camionesFiltrados.length === 0 ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>
                  {rutaSeleccionada === 'todas' ? 'No hay camiones registrados.' : 'No hay camiones asignados a esta ruta.'}
                </p>
              ) : (
                camionesFiltrados.map(c => {
                  const estado = estadoDeDisponibilidad(c.nombre_disponibilidad);
                  const key = String(c.camion_id);
                  const conductor = conductorDeCamion(c.camion_id);
                  return (
                    <div
                      key={c.camion_id}
                      className={`truck-row ${seleccionado === key ? 'truck-row--selected' : ''}`}
                      onClick={() => setSeleccionado(key === seleccionado ? null : key)}
                    >
                      <span className={`sdot ${estadoDotClass[estado]}`} />
                      <div className="truck-info">
                        <span className="truck-name">{c.placa} · {c.modelo}</span>
                        <span className="truck-driver">{conductor ?? 'Sin conductor asignado'}</span>
                      </div>
                      <div className="truck-right">
                        <span className={`tbadge ${estadoBadgeClass[estado]}`}>{labelDisponibilidad(c.nombre_disponibilidad)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ANOMALÍAS */}
          <div className="card card--incidencias">
            <h2 className="card-title">Anomalías</h2>
            <div className="alerts-list">
              {loadingAnomalias ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>Cargando anomalías...</p>
              ) : errorAnomalias ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>{errorAnomalias}</p>
              ) : anomalias.length === 0 ? (
                <p className="alerta-detalle" style={{ padding: '8px 4px' }}>No hay anomalías registradas.</p>
              ) : (
                anomalias.map((a) => (
                  <div
                    key={a.anomalia_id}
                    className={`alerta ${a.estado === 'PENDIENTE' ? 'alerta--critica' : 'alerta--advertencia'}`}
                  >
                    <FiAlertTriangle className="alerta-icon" />
                    <div className="alerta-body">
                      <p className="alerta-titulo" style={{ textTransform: 'capitalize' }}>
                        {a.tipo_anomalia} · {formatFechaAnomalia(a.fecha_reporte)}
                      </p>
                      <p className="alerta-detalle">{a.descripcion}</p>
                      {a.punto_id && (
                        <p className="alerta-detalle" style={{ marginTop: '6px', fontWeight: 600 }}>
                          📍 Punto de recolección: {a.punto_id}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
);
}
