import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import MapaSuchiapa, { type CamionMapa } from './mapa/MapaSuchiapa';
import { obtenerDireccionCompleta, type DireccionCompleta } from './mapa/geocodificacion';
import { apiRequest, ApiError } from '../../services/api';
import { useTrackingWS } from '../../hooks/useTrackingWS';
import './Dashboard.css';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Incidencia {
  id: number;
  fecha: string;
  hora: string;
  descripcion: string;
  ubicacion: string;
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

interface Alerta {
  id: number;
  titulo: string;
  detalle: string;
  tipo: 'critica' | 'advertencia';
  tiempo: string;
}

interface PuntoRuta {
  lat: number;
  lng: number;
  direccion: string;
  direccionCompleta: DireccionCompleta | null;
}

interface DireccionCompleta {
  display_name: string;
  calle?: string | null;
  cp?: string | null;
  colonia?: string | null;
  municipio?: string | null;
  estado?: string | null;
}

interface Conductor {
  id: number;
  nombre: string;
  email: string;
}

// ─── Datos simulados ──────────────────────────────────────────────────────────
const RUTAS_INICIALES: Ruta[] = [
  { id: '01', nombre: 'Camión 1', conductor: '', estado: 'alerta',    progreso: 65,  color: '#E24B4A', badge: 'Detenido' },
  { id: '02', nombre: 'Camión 2', conductor: '', estado: 'advertencia', progreso: 40, color: '#BA7517', badge: 'En movimiento' },
  { id: '03', nombre: 'Camión 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },
];

const ALERTAS: Alerta[] = [
  { id: 1, titulo: 'Camión 1 — En movimiento', detalle: 'Ruta activa · Progreso normal', tipo: 'advertencia', tiempo: 'Ahora' },
  { id: 2, titulo: 'Camión 2 — Retraso en ruta', detalle: '30 min sobre tiempo estimado', tipo: 'advertencia', tiempo: '10 min' },
  { id: 3, titulo: 'Camión 3 — Finalizado', detalle: 'Ruta completada exitosamente', tipo: 'advertencia', tiempo: '2h' },
];

const INCIDENCIAS: Incidencia[] = [
  { id: 1, fecha: '2026-04-20', hora: '08:32', descripcion: 'Se encontraron residuos peligrosos y no aptos, se requiere intervención inmediata.', ubicacion: 'Suchiapa, Punto de recolección: Num 5' },
  { id: 2, fecha: '2026-04-20', hora: '10:15', descripcion: 'Material no clasificado detectado en ruta de recolección.', ubicacion: 'Suchiapa Punto de recolección: Num 12' },
  { id: 3, fecha: '2026-04-20', hora: '14:45', descripcion: 'Incidente de tráfico reportado en la ruta de recolección.', ubicacion: 'Suchiapa Punto de recolección: Num 8' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pad(n: number): string { return String(n).padStart(2, '0'); }

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [rutas] = useState<Ruta[]>(RUTAS_INICIALES);
  const [ahora, setAhora] = useState(new Date());
  const [modoRuta, setModoRuta] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState<number | null>(null);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);
  const [rutasActivas, setRutasActivas] = useState<Array<{ruta_id: number; nombre: string; conductor_id: number | null; puntos: Array<[number, number]>}>>([]);

  // Tracking en vivo de conductores via WebSocket
  const { conductores: conductoresEnVivo, conectado: wsConectado } = useTrackingWS();

  useEffect(() => {
    const iv = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Cargar conductores
  useEffect(() => {
    const cargarConductores = async () => {
      try {
        const response = await apiRequest<any>('/api/empleados');
        const data = response.data || response;
        if (Array.isArray(data)) {
          const listaConductores = data
            .filter((emp: any) => emp.rol_id === 2)
            .map((emp: any) => ({ id: emp.id, nombre: `${emp.nombre || ''} ${emp.apellidos || emp.apellido || ''}`.trim(), email: emp.mail || emp.email || '' }));
          setConductores(listaConductores);
          console.log('Conductores cargados:', listaConductores.length);
        }
      } catch (err) {
        console.error('Error cargando conductores:', err);
      }
    };
    cargarConductores();
  }, []);

  // Cargar rutas activas de api_ruta
  useEffect(() => {
    const cargarRutas = async () => {
      try {
        const apiRutaUrl = import.meta.env.VITE_API_RUTA_URL || '';
        if (!apiRutaUrl) return;
        const res = await fetch(`${apiRutaUrl}/rutas/activas`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const rutasData = json.data.map((r: any) => {
            const jsonRuta = typeof r.json_ruta === 'string' ? JSON.parse(r.json_ruta) : r.json_ruta;
            const puntosArr = jsonRuta?.puntos || [];
            const puntos: [number, number][] = puntosArr.map((p: any) => [p.lat, p.lng]);
            return { ruta_id: r.ruta_id, nombre: r.nombre, conductor_id: r.conductor_id, puntos };
          });
          setRutasActivas(rutasData);
        }
      } catch (e) {
        console.error('Error cargando rutas activas:', e);
      }
    };
    cargarRutas();
  }, []);

  const activarModoRuta = () => { setPuntosRuta([]); setNombreRutaNueva(''); setErrorRuta(null); setModoRuta(true); };
  const cancelarModoRuta = () => { setModoRuta(false); setPuntosRuta([]); setNombreRutaNueva(''); setErrorRuta(null); };

  const agregarPuntoRuta = async (punto: [number, number]) => {
    const [lat, lng] = punto;
    setPuntosRuta(prev => [...prev, { lat, lng, direccion: 'Buscando dirección…', direccionCompleta: null }]);
    const direccionCompleta = await obtenerDireccionCompleta(punto);
    setPuntosRuta(prev => prev.map(p => (p.lat === lat && p.lng === lng ? { ...p, direccion: direccionCompleta?.display_name || 'Sin dirección disponible', direccionCompleta } : p)));
  };

  const guardarRuta = async () => {
    if (!nombreRutaNueva.trim()) { setErrorRuta('Ponle un nombre a la ruta.'); return; }
    if (puntosRuta.length < 2) { setErrorRuta('Selecciona al menos 2 puntos.'); return; }
    if (!conductorSeleccionado) { setErrorRuta('Selecciona un conductor.'); return; }
    setGuardandoRuta(true); setErrorRuta(null);
    try {
      const primerPunto = puntosRuta[0];
      const baseInicio = { lat: primerPunto.lat, lng: primerPunto.lng, nombre: 'Base Inicio' };
      const ultimoPunto = puntosRuta[puntosRuta.length - 1];
      const baseFin = { lat: ultimoPunto.lat, lng: ultimoPunto.lng, nombre: 'Base Fin' };
      const conductorNombre = conductores.find(c => c.id === conductorSeleccionado)?.nombre || 'Sin asignar';
      const puntosCompletos = puntosRuta.map((p, i) => {
        const dir = p.direccionCompleta;
        return { id: i + 1, orden: i + 1, lat: p.lat, lng: p.lng, nombre: p.direccion || `Punto ${i + 1}`, direccion: p.direccion, calle: dir?.calle || null, colonia: dir?.colonia || null, municipio: dir?.municipio || null, estado: dir?.estado || null, cp: dir?.cp || null, es_inicio: i === 0, es_fin: i === puntosRuta.length - 1 };
      });

      const rutaResponse = await apiRequest<{ success: boolean; data: { ruta_id: number } }>('/rutas/', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombreRutaNueva.trim(), descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length} puntos. Asignada a ${conductorNombre}.`, conductor_id: conductorSeleccionado, json_ruta: { type: 'LineString', coordinates: puntosRuta.map(p => [p.lng, p.lat]), puntos: puntosCompletos, base_inicio: baseInicio, base_fin: baseFin } }),
      });
      const rutaId = rutaResponse.data.ruta_id;

      for (let i = 0; i < puntosRuta.length; i++) {
        const punto = puntosRuta[i]; const dir = punto.direccionCompleta;
        await apiRequest('/puntos-recoleccion/', { method: 'POST', body: JSON.stringify({ ruta_id: rutaId, orden: i + 1, nombre: punto.direccion, direccion: punto.direccion, lat: punto.lat, lon: punto.lng, calle: dir?.calle || null, colonia: dir?.colonia || null, municipio: dir?.municipio || null, estado: dir?.estado || null, cp: dir?.cp || null, es_inicio: i === 0, es_fin: i === puntosRuta.length - 1 }) });
      }

      try {
        await apiRequest<any>(`/optimizar/ruta/${rutaId}`, { method: 'POST' });
        alert(`✓ Ruta "${nombreRutaNueva}" guardada y optimizada`);
      } catch { alert(`✓ Ruta "${nombreRutaNueva}" guardada (sin optimizar)`); }
      cancelarModoRuta();
    } catch (err) {
      setErrorRuta(err instanceof ApiError ? err.message : 'No se pudo guardar la ruta.');
    } finally { setGuardandoRuta(false); }
  };

  const metricas = {
    total: rutas.length,
    completadas: rutas.filter(r => r.estado === 'ok').length,
    activos: rutas.filter(r => r.estado === 'advertencia').length,
    alertas: ALERTAS.length,
  };

  const barColor: Record<string, string> = { alerta: '#E24B4A', advertencia: '#BA7517', ok: '#639922' };

  const camionesMapa: CamionMapa[] = rutas.map(r => ({
    id: r.id, nombre: r.nombre, color: r.color, estadoIcono: 'activo' as any, ruta: [],
  }));

  return (
    <div className="dash-container">
      <div className="dashboard">
        {/* HEADER */}
        <header className="dash-header">
          <div className="dash-header-left">
            <div>
              <h1>Monitoreo de flota</h1>
              <p className="dash-subtitle">Turno matutino · Zona Norte</p>
            </div>
          </div>
          <div className="dash-clock">
            {pad(ahora.getHours())}:{pad(ahora.getMinutes())}:{pad(ahora.getSeconds())}
          </div>
        </header>

        {/* MÉTRICAS */}
        <div className="dash-metrics">
          <div className="metric"><span className="metric-lbl">Total</span><span className="metric-val">{metricas.total}</span><span className="metric-lbl">camiones</span></div>
          <div className="metric"><span className="metric-lbl">Completadas</span><span className="metric-val val-ok">{metricas.completadas}</span><span className="metric-lbl">rutas</span></div>
          <div className="metric"><span className="metric-lbl">En curso</span><span className="metric-val val-info">{metricas.activos}</span><span className="metric-lbl">activos</span></div>
          <div className="metric"><span className="metric-lbl">Alertas</span><span className="metric-val val-danger">{metricas.alertas}</span><span className="metric-lbl">activas</span></div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="dash-main-grid">
          {/* MAPA REAL con rutas activas y conductores en vivo */}
          <div className={`card ${modoRuta ? 'card--mapa-expandido' : ''}`}>
            <div className="card-title card-title--flex">
              <span>Mapa de rutas - Tiempo real {wsConectado ? '🟢' : '🔴'} {conductoresEnVivo.length > 0 ? `(${conductoresEnVivo.length} activo${conductoresEnVivo.length > 1 ? 's' : ''})` : ''}</span>
              {!modoRuta ? (
                <button className="pager-btn" onClick={activarModoRuta}>Poner ruta</button>
              ) : (
                <div className="mapa-ruta-acciones">
                  <input className="mapa-ruta-nombre" placeholder="Nombre de la ruta" value={nombreRutaNueva} onChange={(e) => setNombreRutaNueva(e.target.value)} />
                  <select className="camion-selector" value={conductorSeleccionado ?? ''} onChange={(e) => setConductorSeleccionado(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Selecciona conductor</option>
                    {conductores.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </select>
                  <span className="pager-info">{puntosRuta.length} puntos</span>
                  <button className="pager-btn" onClick={() => setPuntosRuta(prev => prev.slice(0, -1))} disabled={puntosRuta.length < 1}>Deshacer</button>
                  <button className="pager-btn" onClick={guardarRuta} disabled={guardandoRuta}>{guardandoRuta ? 'Guardando…' : 'Guardar ruta'}</button>
                  <button className="pager-btn" onClick={cancelarModoRuta}>Cerrar</button>
                </div>
              )}
            </div>
            {errorRuta && <p className="mapa-ruta-error">{errorRuta}</p>}
            <div className={`mapa-wrap ${modoRuta ? 'mapa-wrap--expandido' : ''}`}>
              <MapaSuchiapa
                camiones={camionesMapa}
                conductoresEnVivo={conductoresEnVivo}
                rutasActivas={rutasActivas}
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

          {/* COLUMNA DERECHA */}
          <div className="right-column">
            <div className="card card--alerts">
              <h2 className="card-title">Alertas activas</h2>
              <div className="alerts-list compact">
                {ALERTAS.map(a => (
                  <div key={a.id} className={`alerta alerta--${a.tipo}`}>
                    <FiAlertTriangle className="alerta-icon" />
                    <div className="alerta-body">
                      <p className="alerta-titulo">{a.titulo}</p>
                      <p className="alerta-detalle">{a.detalle}</p>
                    </div>
                    <span className="alerta-time">{a.tiempo}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card--incidencias">
              <h2 className="card-title">Incidencias</h2>
              <div className="alerts-list">
                {INCIDENCIAS.map((inc) => (
                  <div key={inc.id} className="alerta alerta--critica">
                    <FiAlertTriangle className="alerta-icon" />
                    <div className="alerta-body">
                      <p className="alerta-titulo">{inc.fecha} · {inc.hora}</p>
                      <p className="alerta-detalle">{inc.descripcion}</p>
                      <p className="alerta-detalle" style={{ marginTop: '6px', fontWeight: 600 }}>📍 {inc.ubicacion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PROGRESO FULL WIDTH */}
        <div className="dash-full">
          <div className="card">
            <h2 className="card-title">Progreso por ruta</h2>
            {rutas.map(r => (
              <div key={r.id} className="ruta-bar">
                <div className="ruta-bar-top">
                  <span className="rlbl">Ruta {r.id === '01' ? 'A' : r.id === '02' ? 'B' : 'C'} · {r.nombre}</span>
                  <span className="rpct">{r.progreso}%</span>
                </div>
                <div className="rtrack">
                  <div className="rfill" style={{ width: `${r.progreso}%`, background: barColor[r.estado] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
