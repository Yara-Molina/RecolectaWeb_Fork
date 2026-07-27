import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import MapaSuchiapa, { type CamionMapa } from './mapa/MapaSuchiapa';
import { obtenerDireccionCompleta } from './mapa/geocodificacion';
import { apiRequest, ApiError } from '../../services/api';
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

interface DireccionCompleta {
  display_name: string;
  calle?: string | null;
  cp?: string | null;
  colonia?: string | null;
  municipio?: string | null;
  estado?: string | null;
}

interface PuntoRuta {
  lat: number;
  lng: number;
  direccion: string;
  direccionCompleta: DireccionCompleta | null;
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

// Base de inicio fija (Laredo Texas, Suchiapa)
const BASE_INICIO: PuntoRuta = {
  lat: 16.62910,
  lng: -93.10414,
  direccion: 'BASE INICIAL: Laredo Texas, Suchiapa, Chiapas, 29150, México',
  direccionCompleta: {
    display_name: 'Laredo Texas, Suchiapa, Chiapas, 29150, México',
    calle: 'Laredo Texas',
    cp: '29150',
    colonia: null,
    municipio: 'Suchiapa',
    estado: 'Chiapas'
  }
};

// ─── Datos simulados ──────────────────────────────────────────────────────────

const RUTAS_INICIALES: Ruta[] = [
  { id: '01', nombre: 'Camión 1', conductor: '', estado: 'alerta',    progreso: 65,  color: '#E24B4A', badge: 'Detenido' },
  { id: '02', nombre: 'Camión 2', conductor: '', estado: 'advertencia', progreso: 40, color: '#BA7517', badge: 'En movimiento' },
  { id: '03', nombre: 'Camión 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },
];

// Rutas geográficas reales sobre Suchiapa, Chiapas. Cada array = waypoints [lat, lng]
const RUTAS_GEO: Record<string, [number, number][]> = {
  '01': [[16.6205, -93.1042], [16.6198, -93.1015], [16.6185, -93.0998], [16.617, -93.0985]],
  '02': [[16.612, -93.108], [16.6135, -93.1055], [16.615, -93.103], [16.6166, -93.1005]],
  '03': [[16.6095, -93.0965], [16.611, -93.098], [16.613, -93.0995], [16.615, -93.101]],
};

const ESTADO_ICONO: Record<string, CamionMapa['estadoIcono']> = {
  alerta: 'parado',
  advertencia: 'retrasado',
  ok: 'activo',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const [rutas]        = useState<Ruta[]>(RUTAS_INICIALES);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [ahora, setAhora]              = useState(new Date());

  const [modoRuta, setModoRuta] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState('');
  const [conductorSeleccionado] = useState<number | null>(12); // Francisco Castro ID 12 por defecto -- fijo por ahora, sin selector en UI
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);

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

  const camionesMapa: CamionMapa[] = rutas.map(r => ({
    id: r.id,
    nombre: r.nombre,
    color: r.color,
    estadoIcono: ESTADO_ICONO[r.estado] ?? 'activo',
    ruta: RUTAS_GEO[r.id] ?? [],
  }));

  const activarModoRuta = () => {
    setPuntosRuta([BASE_INICIO]); // Siempre empieza con la base de inicio
    setNombreRutaNueva('');
    setErrorRuta(null);
    setModoRuta(true);
  };

  const cancelarModoRuta = () => {
    setModoRuta(false);
    setPuntosRuta([]);
    setNombreRutaNueva('');
    setErrorRuta(null);
  };

  const agregarPuntoRuta = async (punto: [number, number]) => {
    const [lat, lng] = punto;

    // No permitir agregar más puntos si se hace clic en la base de inicio
    if (lat === BASE_INICIO.lat && lng === BASE_INICIO.lng) {
      return;
    }

    setPuntosRuta(prev => [...prev, { lat, lng, direccion: 'Buscando dirección…', direccionCompleta: null }]);

    const direccionCompleta = await obtenerDireccionCompleta(punto);

    setPuntosRuta(prev =>
      prev.map(p => (p.lat === lat && p.lng === lng ? {
        ...p,
        direccion: direccionCompleta?.display_name || 'Sin dirección disponible',
        direccionCompleta
      } : p)),
    );
  };

  const guardarRuta = async () => {
    if (!nombreRutaNueva.trim()) {
      setErrorRuta('Ponle un nombre a la ruta antes de guardarla.');
      return;
    }

    if (puntosRuta.length < 2) {
      setErrorRuta('Selecciona al menos 1 punto además de la base inicial.');
      return;
    }

    if (!conductorSeleccionado) {
      setErrorRuta('Cargando información del conductor, espera un momento...');
      return;
    }

    setGuardandoRuta(true);
    setErrorRuta(null);

    try {
      // Preparar base_inicio y base_fin para el AG
      const baseInicio = {
        lat: BASE_INICIO.lat,
        lng: BASE_INICIO.lng,
        nombre: 'Base Inicio'
      };

      // El último punto será la base de fin
      const ultimoPunto = puntosRuta[puntosRuta.length - 1];
      const baseFin = {
        lat: ultimoPunto.lat,
        lng: ultimoPunto.lng,
        nombre: 'Base Fin'
      };

      const conductorNombre = conductores.find(c => c.id === conductorSeleccionado)?.nombre || 'Francisco Castro';

      // Construir array completo de puntos con toda la info (lat, lng, direccion, calle...)
      const puntosCompletos = puntosRuta.map((p, i) => {
        const esBaseInicio = i === 0;
        const esBaseFin = i === puntosRuta.length - 1;
        const dir = p.direccionCompleta;
        return {
          id: i + 1,
          orden: i + 1,
          lat: p.lat,
          lng: p.lng,
          nombre: p.direccion || `Punto ${i + 1}`,
          direccion: p.direccion,
          calle: dir?.calle || null,
          colonia: dir?.colonia || null,
          municipio: dir?.municipio || null,
          estado: dir?.estado || null,
          cp: dir?.cp || null,
          es_inicio: esBaseInicio,
          es_fin: esBaseFin,
        };
      });

      console.log('Guardando ruta:', nombreRutaNueva, 'con', puntosRuta.length, 'puntos');
      console.log('Asignada a:', conductorNombre, '(ID:', conductorSeleccionado, ')');
      console.log('Puntos completos:', JSON.stringify(puntosCompletos, null, 2));

      // 1. Crear la ruta con conductor asignado y TODOS los puntos en json_ruta
      const rutaResponse = await apiRequest<{ success: boolean; data: { ruta_id: number } }>('/rutas/', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombreRutaNueva.trim(),
          descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length} puntos. Asignada a ${conductorNombre}.`,
          conductor_id: conductorSeleccionado,
          json_ruta: {
            type: 'LineString',
            coordinates: puntosRuta.map(p => [p.lng, p.lat]),
            puntos: puntosCompletos, // Todos los puntos con lat, lng, direccion
            base_inicio: baseInicio,
            base_fin: baseFin
          },
        }),
      });

      console.log('Ruta creada:', rutaResponse);
      const rutaId = rutaResponse.data.ruta_id;

      // 2. Crear los puntos de recolección con toda la información
      console.log('Creando puntos de recolección para ruta', rutaId);
      for (let i = 0; i < puntosRuta.length; i++) {
        const punto = puntosRuta[i];
        const esBaseInicio = i === 0;
        const esBaseFin = i === puntosRuta.length - 1;

        let nombrePunto = punto.direccion || `Punto ${i + 1}`;
        if (esBaseInicio) nombrePunto = 'BASE INICIO: ' + nombrePunto;
        if (esBaseFin) nombrePunto = 'BASE FIN: ' + nombrePunto;

        const dir = punto.direccionCompleta;

        await apiRequest('/puntos-recoleccion/', {
          method: 'POST',
          body: JSON.stringify({
            ruta_id: rutaId,
            orden: i + 1,
            nombre: nombrePunto,
            direccion: punto.direccion,
            lat: punto.lat,
            lon: punto.lng, // La BD usa 'lon', no 'lng'
            calle: dir?.calle || null,
            colonia: dir?.colonia || null,
            municipio: dir?.municipio || null,
            estado: dir?.estado || null,
            cp: dir?.cp || null,
            es_inicio: esBaseInicio,
            es_fin: esBaseFin,
          }),
        });
      }

      console.log('Ruta y puntos guardados exitosamente');

      // 3. Optimizar la ruta con el AG (algoritmo genético)
      console.log('Optimizando ruta con AG...');
      try {
        const optimizacion = await apiRequest<{ success: boolean; message: string; data: any }>(`/optimizar/ruta/${rutaId}`, {
          method: 'POST',
        });
        console.log('Ruta optimizada por AG:', optimizacion);

        if (optimizacion.success) {
          alert(`✓ Ruta "${nombreRutaNueva}" guardada y OPTIMIZADA con ${puntosRuta.length} puntos\n\nAsignada a: ${conductorNombre}\nDistancia: ${optimizacion.data?.distancia_total_km || 'N/A'} km\nBase inicio: Laredo Texas\nBase fin: ${ultimoPunto.direccion}`);
        } else {
          alert(`✓ Ruta "${nombreRutaNueva}" guardada con ${puntosRuta.length} puntos\n\n⚠ No se pudo optimizar (AG no disponible)\nAsignada a: ${conductorNombre}`);
        }
      } catch (optErr) {
        console.warn('No se pudo optimizar con AG:', optErr);
        alert(`✓ Ruta "${nombreRutaNueva}" guardada con ${puntosRuta.length} puntos\n\n⚠ No se optimizó (AG no disponible, revisa que esté corriendo en puerto 8003)\nAsignada a: ${conductorNombre}`);
      }

      cancelarModoRuta();
    } catch (err) {
      console.error('Error guardando ruta:', err);
      setErrorRuta(err instanceof ApiError ? err.message : 'No se pudo guardar la ruta.');
    } finally {
      setGuardandoRuta(false);
    }
  };

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

        {/* COLUMNA IZQUIERDA: MAPA + PROGRESO */}
        <div className="left-column">
          <div className={`card ${modoRuta ? 'card--mapa-expandido' : ''}`}>
            <div className="card-title card-title--flex">
              <span>Mapa de rutas · Tiempo real</span>
              {!modoRuta ? (
                <button className="pager-btn" onClick={activarModoRuta}>Poner ruta</button>
              ) : (
                <div className="mapa-ruta-acciones">
                  <input
                    className="mapa-ruta-nombre"
                    placeholder="Nombre de la ruta"
                    value={nombreRutaNueva}
                    onChange={(e) => setNombreRutaNueva(e.target.value)}
                  />
                  <span className="pager-info">{puntosRuta.length} puntos</span>
                  <button className="pager-btn" onClick={() => setPuntosRuta(prev => prev.slice(0, -1))} disabled={puntosRuta.length <= 1}>Deshacer</button>
                  <button className="pager-btn" onClick={guardarRuta} disabled={guardandoRuta}>
                    {guardandoRuta ? 'Guardando…' : 'Guardar ruta'}
                  </button>
                  <button className="pager-btn" onClick={cancelarModoRuta}>Cerrar</button>
                </div>
              )}
            </div>
            {errorRuta && <p className="mapa-ruta-error">{errorRuta}</p>}
            <div className={`mapa-wrap ${modoRuta ? 'mapa-wrap--expandido' : ''}`}>
              <MapaSuchiapa
                camiones={camionesMapa}
                seleccionable={modoRuta}
                puntos={puntosRuta.map(p => [p.lat, p.lng] as [number, number])}
                onAgregarPunto={agregarPuntoRuta}
              />
            </div>
            {modoRuta && puntosRuta.length > 0 && (
              <ul className="mapa-ruta-lista">
                {puntosRuta.map((p, i) => (
                  <li key={`${p.lat}-${p.lng}-${i}`}>
                    <strong>{i + 1}.</strong> {p.direccion} <span className="mapa-ruta-coords">({p.lat.toFixed(5)}, {p.lng.toFixed(5)})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
