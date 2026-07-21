// Dashboard.tsx - Componente principal del dashboard de monitoreo de flota
import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import MapaSuchiapa, { type CamionMapa } from './mapa/MapaSuchiapa';
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
  camion: string;
  titulo: string;
  detalle: string;
  tipo: 'critica' | 'advertencia';
  tiempo: string;
}

// ─── Datos simulados ──────────────────────────────────────────────────────────

const RUTAS_INICIALES: Ruta[] = [
  { id: '01', nombre: 'Camión 1', conductor: '', estado: 'alerta',    progreso: 65,  color: '#E24B4A', badge: 'Detenido' },
  { id: '02', nombre: 'Camión 2', conductor: '', estado: 'advertencia', progreso: 40, color: '#BA7517', badge: 'En movimiento' },
  { id: '03', nombre: 'Camión 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },
];

const ALERTAS: Alerta[] = [
  { id: 1, camion: 'Camión 1', titulo: 'Camión 1 — En movimiento', detalle: 'Ruta activa · Progreso normal', tipo: 'advertencia', tiempo: 'Ahora' },
  { id: 2, camion: 'Camión 2', titulo: 'Camión 2 — Retraso en ruta', detalle: '30 min sobre tiempo estimado', tipo: 'advertencia', tiempo: '10 min' },
  { id: 3, camion: 'Camión 3', titulo: 'Camión 3 — Finalizado', detalle: 'Ruta completada exitosamente', tipo: 'advertencia', tiempo: '2h' },
];

const INCIDENCIAS: Incidencia[] = [
  {
    id: 1,
    fecha: '2026-04-20',
    hora: '08:32',
    descripcion: 'Se encontraron residuos peligrosos y no aptos, se requiere intervención inmediata.',
    ubicacion: 'Suchiapa, Punto de recolección: Num 5'
  },
  {
    id: 2,
    fecha: '2026-04-20',
    hora: '10:15',
    descripcion: 'Material no clasificado detectado en ruta de recolección.',
    ubicacion: 'Suchiapa Punto de recolección: Num 12'
  },
  {
    id: 3,
    fecha: '2026-04-20',
    hora: '14:45',
    descripcion: 'Incidente de tráfico reportado en la ruta de recolección.',
    ubicacion: 'Suchiapa Punto de recolección: Num 8'
  }

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

function pad(n: number): string { return String(n).padStart(2, '0'); }

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const [rutas]        = useState<Ruta[]>(RUTAS_INICIALES);
  const [ahora, setAhora]              = useState(new Date());
  const [filtroCamion, setFiltroCamion] = useState<string>('todos');
  const [pagIncidencia, setPagIncidencia] = useState(0);
  const [pagAlerta, setPagAlerta] = useState(0);
  const [rutaProgreso, setRutaProgreso] = useState<string>(RUTAS_INICIALES[0].id);
  const [modoRuta, setModoRuta] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState<[number, number][]>([]);

  const rutaSeleccionada = rutas.find(r => r.id === rutaProgreso) ?? rutas[0];

  const activarModoRuta = () => {
    setPuntosRuta([]);
    setModoRuta(true);
  };

  const cancelarModoRuta = () => {
    setModoRuta(false);
    setPuntosRuta([]);
  };

  const agregarPuntoRuta = (punto: [number, number]) => {
    setPuntosRuta(prev => [...prev, punto]);
  };

  const camionesMapa: CamionMapa[] = rutas.map(r => ({
    id: r.id,
    nombre: r.nombre,
    color: r.color,
    estadoIcono: ESTADO_ICONO[r.estado] ?? 'activo',
    ruta: RUTAS_GEO[r.id] ?? [],
  }));

  const alertasFiltradas = filtroCamion === 'todos'
    ? ALERTAS
    : ALERTAS.filter(a => a.camion === filtroCamion);

  const incidenciaActual = INCIDENCIAS[pagIncidencia];

  // Alertas paginadas de 2 en 2
  const ALERTAS_POR_PAGINA = 2;
  const totalPagAlertas = Math.max(1, Math.ceil(alertasFiltradas.length / ALERTAS_POR_PAGINA));
  const alertasPagina = alertasFiltradas.slice(
    pagAlerta * ALERTAS_POR_PAGINA,
    pagAlerta * ALERTAS_POR_PAGINA + ALERTAS_POR_PAGINA,
  );

  useEffect(() => {
    const iv = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setPagAlerta(0);
  }, [filtroCamion]);

  const barColor: Record<string, string> = { alerta: '#E24B4A', advertencia: '#BA7517', ok: '#639922' };

 // SOLO cambia la parte del render (return)

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
                  <span className="pager-info">{puntosRuta.length} puntos</span>
                  <button className="pager-btn" onClick={() => setPuntosRuta(prev => prev.slice(0, -1))} disabled={puntosRuta.length === 0}>Deshacer</button>
                  <button className="pager-btn" onClick={cancelarModoRuta}>Cerrar</button>
                </div>
              )}
            </div>
            <div className={`mapa-wrap ${modoRuta ? 'mapa-wrap--expandido' : ''}`}>
              <MapaSuchiapa
                camiones={camionesMapa}
                seleccionable={modoRuta}
                puntos={puntosRuta}
                onAgregarPunto={agregarPuntoRuta}
              />
            </div>
          </div>

          {/* PROGRESO POR RUTA */}
          <div className="card">
            <div className="card-title card-title--flex">
              <span>Progreso por ruta</span>
              <select
                className="camion-selector"
                value={rutaProgreso}
                onChange={(e) => setRutaProgreso(e.target.value)}
              >
                {rutas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div className="ruta-bar">
              <div className="ruta-bar-top">
                <span className="rlbl">
                  Ruta {rutaSeleccionada.id === '01' ? 'A' : rutaSeleccionada.id === '02' ? 'B' : 'C'} · {rutaSeleccionada.nombre}
                </span>
                <span className="rpct">{rutaSeleccionada.progreso}%</span>
              </div>
              <div className="rtrack">
                <div className="rfill" style={{ width: `${rutaSeleccionada.progreso}%`, background: barColor[rutaSeleccionada.estado] }} />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="right-column">

          {/* INCIDENCIAS - REPORTES CON PAGINACIÓN */}
          <div className="card card--incidencias">
            <h2 className="card-title">Incidencias · Reportes</h2>
            <div className="reporte-wrap">
              {incidenciaActual && (
                <div className="reporte-card">
                  <span className="reporte-fecha-flotante">
                    {incidenciaActual.fecha} · {incidenciaActual.hora}
                  </span>
                  <FiAlertTriangle className="reporte-icon" />
                  <p className="reporte-desc">{incidenciaActual.descripcion}</p>
                  <p className="reporte-ubi">📍 {incidenciaActual.ubicacion}</p>
                </div>
              )}

              <div className="reporte-pager">
                <button
                  className="pager-btn"
                  onClick={() => setPagIncidencia(p => Math.max(0, p - 1))}
                  disabled={pagIncidencia === 0}
                >
                  ‹ Anterior
                </button>
                <span className="pager-info">
                  {pagIncidencia + 1} / {INCIDENCIAS.length}
                </span>
                <button
                  className="pager-btn"
                  onClick={() => setPagIncidencia(p => Math.min(INCIDENCIAS.length - 1, p + 1))}
                  disabled={pagIncidencia === INCIDENCIAS.length - 1}
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </div>

          {/* ALERTAS ACTIVAS CON SELECTOR DE CAMIÓN */}
          <div className="card card--alerts-full">
            <div className="card-title card-title--flex">
              <span>Alertas activas</span>
              <select
                className="camion-selector"
                value={filtroCamion}
                onChange={(e) => setFiltroCamion(e.target.value)}
              >
                <option value="todos">Todos los camiones</option>
                {rutas.map(r => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div className="alerts-grid">
              {alertasFiltradas.length === 0 && (
                <p className="alerts-empty">Sin alertas para este camión.</p>
              )}
              {alertasPagina.map(a => (
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

            {alertasFiltradas.length > 0 && (
              <div className="reporte-pager alerts-pager">
                <button
                  className="pager-btn"
                  onClick={() => setPagAlerta(p => Math.max(0, p - 1))}
                  disabled={pagAlerta === 0}
                >
                  ‹ Anterior
                </button>
                <span className="pager-info">
                  {pagAlerta + 1} / {totalPagAlertas}
                </span>
                <button
                  className="pager-btn"
                  onClick={() => setPagAlerta(p => Math.min(totalPagAlertas - 1, p + 1))}
                  disabled={pagAlerta === totalPagAlertas - 1}
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  </div>
);
}
