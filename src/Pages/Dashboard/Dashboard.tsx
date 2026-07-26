import { useState, useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import MapaSuchiapa, { type CamionMapa } from './mapa/MapaSuchiapa';
import { obtenerDireccionCompleta } from './mapa/geocodificacion';
import { apiRequest, ApiError } from '../../services/api';
import { ROLES } from '../../services/auth';
import './Dashboard.css';


interface Incidencia {
  id: number;
  fecha: string;
  hora: string;
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

interface PuntoRuta {
  lat: number;
  lng: number;
  direccion: string;
  direccionCompleta: DireccionCompleta | null;
}

interface Conductor {
  id: number;
  nombre: string;
  email: string;
}


const BASE_INICIO: PuntoRuta = {
  lat: 16.62910,
  lng: -93.10414,
  direccion: 'BASE INICIAL: Laredo Texas, Suchiapa, Chiapas, 29150, Mexico',
  direccionCompleta: {
    display_name: 'Laredo Texas, Suchiapa, Chiapas, 29150, Mexico',
    calle: 'Laredo Texas',
    cp: '29150',
    colonia: undefined,
    municipio: 'Suchiapa',
    estado: 'Chiapas'
  }
};



const RUTAS_INICIALES: Ruta[] = [
  { id: '01', nombre: 'Camion 1', conductor: '', estado: 'alerta',    progreso: 65,  color: '#E24B4A', badge: 'Detenido' },
  { id: '02', nombre: 'Camion 2', conductor: '', estado: 'advertencia', progreso: 40, color: '#BA7517', badge: 'En movimiento' },
  { id: '03', nombre: 'Camion 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },
];

const ALERTAS: Alerta[] = [
  { id: 1, camion: 'Camion 1', titulo: 'Camion 1 - En movimiento', detalle: 'Ruta activa - Progreso normal', tipo: 'advertencia', tiempo: 'Ahora' },
  { id: 2, camion: 'Camion 2', titulo: 'Camion 2 - Retraso en ruta', detalle: '30 min sobre tiempo estimado', tipo: 'advertencia', tiempo: '10 min' },
  { id: 3, camion: 'Camion 3', titulo: 'Camion 3 - Finalizado', detalle: 'Ruta completada exitosamente', tipo: 'advertencia', tiempo: '2h' },
];

const INCIDENCIAS: Incidencia[] = [
  {
    id: 1,
    fecha: '2026-04-20',
    hora: '08:32',
    descripcion: 'Se encontraron residuos peligrosos y no aptos, se requiere intervencion inmediata.',
    ubicacion: 'Suchiapa, Punto de recoleccion: Num 5'
  },
  {
    id: 2,
    fecha: '2026-04-20',
    hora: '10:15',
    descripcion: 'Material no clasificado detectado en ruta de recoleccion.',
    ubicacion: 'Suchiapa Punto de recoleccion: Num 12'
  },
  {
    id: 3,
    fecha: '2026-04-20',
    hora: '14:45',
    descripcion: 'Incidente de trafico reportado en la ruta de recoleccion.',
    ubicacion: 'Suchiapa Punto de recoleccion: Num 8'
  }
];


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


export default function Dashboard() {
  const [rutas]        = useState<Ruta[]>(RUTAS_INICIALES);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [ahora, setAhora]              = useState(new Date());

  const [modoRuta, setModoRuta] = useState(false);
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState<number | null>(null);
  const [conductores, setConductores] = useState<Conductor[]>([]);
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
    setPuntosRuta([]);
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

    setPuntosRuta(prev => [...prev, { lat, lng, direccion: 'Buscando direccion...', direccionCompleta: null }]);

    const direccionCompleta = await obtenerDireccionCompleta(punto);

    setPuntosRuta(prev =>
      prev.map(p => (p.lat === lat && p.lng === lng ? { 
        ...p, 
        direccion: direccionCompleta?.display_name || 'Sin direccion disponible',
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
      setErrorRuta('Selecciona al menos 2 puntos para crear la ruta.');
      return;
    }

    if (!conductorSeleccionado) {
      setErrorRuta('Selecciona un conductor antes de guardar la ruta.');
      return;
    }

    setGuardandoRuta(true);
    setErrorRuta(null);

    try {
      const primerPunto = puntosRuta[0];
      const baseInicio = { lat: primerPunto.lat, lng: primerPunto.lng, nombre: 'Base Inicio' };
      const ultimoPunto = puntosRuta[puntosRuta.length - 1];
      const baseFin = { lat: ultimoPunto.lat, lng: ultimoPunto.lng, nombre: 'Base Fin' };

      const conductorNombre = conductores.find(c => c.id === conductorSeleccionado)?.nombre || 'Sin asignar';

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

      const rutaResponse = await apiRequest<{ success: boolean; data: { ruta_id: number } }>('/rutas/', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombreRutaNueva.trim(),
          descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length} puntos. Asignada a ${conductorNombre}.`,
          conductor_id: conductorSeleccionado,
          json_ruta: {
            type: 'LineString',
            coordinates: puntosRuta.map(p => [p.lng, p.lat]),
            puntos: puntosCompletos,
            base_inicio: baseInicio,
            base_fin: baseFin
          },
        }),
      });

      console.log('Ruta creada:', rutaResponse);
      const rutaId = rutaResponse.data.ruta_id;

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
            lon: punto.lng,
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

      console.log('Optimizando ruta con AG...');
      try {
        const optimizacion = await apiRequest<{ success: boolean; message: string; data: any }>(`/optimizar/ruta/${rutaId}`, {
          method: 'POST',
        });
        console.log('Ruta optimizada por AG:', optimizacion);
        
        if (optimizacion.success) {
          alert(`Ruta "${nombreRutaNueva}" guardada y OPTIMIZADA con ${puntosRuta.length} puntos\n\nAsignada a: ${conductorNombre}\nDistancia: ${optimizacion.data?.distancia_total_km || 'N/A'} km\nBase inicio: Laredo Texas\nBase fin: ${ultimoPunto.direccion}`);
        } else {
          alert(`Ruta "${nombreRutaNueva}" guardada con ${puntosRuta.length} puntos\n\nNo se pudo optimizar (AG no disponible)\nAsignada a: ${conductorNombre}`);
        }
      } catch (optErr) {
        console.warn('No se pudo optimizar con AG:', optErr);
        alert(`Ruta "${nombreRutaNueva}" guardada con ${puntosRuta.length} puntos\n\nNo se optimizo (AG no disponible, revisa que este corriendo en puerto 8003)\nAsignada a: ${conductorNombre}`);
      }

      cancelarModoRuta();
    } catch (err) {
      console.error('Error guardando ruta:', err);
      setErrorRuta(err instanceof ApiError ? err.message : 'No se pudo guardar la ruta.');
    } finally {
      setGuardandoRuta(false);
    }
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

  useEffect(() => {
    const cargarConductores = async () => {
      try {
        const response = await apiRequest<any>('/api/empleados/');
        console.log('Respuesta /api/empleados/:', response);

        const empleados = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

        const listaConductores = empleados
          .filter((emp: any) => emp.rol_id === 4 && !emp.desactivado)
          .map((emp: any) => ({
            id: emp.id,
            nombre: `${emp.nombre || ''} ${emp.apellidos || ''}`.trim(),
            email: emp.mail || '',
          }));

        console.log('Conductores encontrados:', listaConductores);
        setConductores(listaConductores);
      } catch (err) {
        console.error('Error cargando conductores:', err);
      }
    };

    cargarConductores();
  }, []);

  const barColor: Record<string, string> = { alerta: '#E24B4A', advertencia: '#BA7517', ok: '#639922' };

  return (
    <div className="dash-container">
      <div className="dashboard">

        <header className="dash-header">
          <div className="dash-header-left">
            <div>
              <h1>Monitoreo de flota</h1>
              <p className="dash-subtitle">Turno matutino - Zona Norte</p>
            </div>
          </div>
          <div className="dash-clock">
            {pad(ahora.getHours())}:{pad(ahora.getMinutes())}:{pad(ahora.getSeconds())}
          </div>
        </header>

        <div className="dash-main-grid">

          <div className="left-column">
            <div className={`card ${modoRuta ? 'card--mapa-expandido' : ''}`}>
              <div className="card-title card-title--flex">
                <span>Mapa de rutas - Tiempo real</span>
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
                    <select
                      className="camion-selector"
                      value={conductorSeleccionado ?? ''}
                      onChange={(e) => setConductorSeleccionado(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Selecciona conductor</option>
                      {conductores.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <span className="pager-info">{puntosRuta.length} puntos</span>
                    <button className="pager-btn" onClick={() => setPuntosRuta(prev => prev.slice(0, -1))} disabled={puntosRuta.length <= 1}>Deshacer</button>
                    <button className="pager-btn" onClick={guardarRuta} disabled={guardandoRuta}>
                      {guardandoRuta ? 'Guardando...' : 'Guardar ruta'}
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
                    Ruta {rutaSeleccionada.id === '01' ? 'A' : rutaSeleccionada.id === '02' ? 'B' : 'C'} - {rutaSeleccionada.nombre}
                  </span>
                  <span className="rpct">{rutaSeleccionada.progreso}%</span>
                </div>
                <div className="rtrack">
                  <div className="rfill" style={{ width: `${rutaSeleccionada.progreso}%`, background: barColor[rutaSeleccionada.estado] }} />
                </div>
              </div>
            </div>
          </div>

          <div className="right-column">

            <div className="card card--incidencias">
              <h2 className="card-title">Incidencias - Reportes</h2>
              <div className="reporte-wrap">
                {incidenciaActual && (
                  <div className="reporte-card">
                    <span className="reporte-fecha-flotante">
                      {incidenciaActual.fecha} · {incidenciaActual.hora}
                    </span>
                    <FiAlertTriangle className="reporte-icon" />
                    <p className="reporte-desc">{incidenciaActual.descripcion}</p>
                    <p className="reporte-ubi">{incidenciaActual.ubicacion}</p>
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
                  <p className="alerts-empty">Sin alertas para este camion.</p>
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
