// pages/EstadoCamiones/EstadoCamiones.tsx
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import './EstadoCamiones.css';
import { apiRequest, ApiError } from '../../services/api';
import {
  FiTruck,
  FiNavigation,
  FiPauseCircle,
  FiHome,
  FiWifiOff,
  FiRefreshCw,
  FiX,
  FiClock,
} from 'react-icons/fi';

// Cada cuánto se vuelve a pedir el estado de la flota.
const REFRESCO_MS = 30_000;

// Códigos que envía la app del conductor (EstadoOperativoConductor).
type CodigoEstado = '1' | '2' | '3' | '4' | '5';

// Tal como responde GET /api/camion/estados
// (gin-backend: src/Camion/application/EstadoCamionesUseCase.go).
interface EstadoCamion {
  camion_id: number;
  placa: string;
  modelo: string;
  estado_flota: string;
  estado: CodigoEstado | null;
  estado_nombre: string | null;
  ruta_id: number | null;
  conductor_id: number | null;
  conductor_nombre: string | null;
  lat: number | null;
  lon: number | null;
  actualizado_en: string | null;
  estado_desde: string | null;
}

// Tal como responde GET /api/camion/{id}/estados
interface RegistroEstado {
  estado: string;
  observaciones: string | null;
  timestamp: string;
}

interface RutaResumen {
  ruta_id: number;
  nombre: string;
}

// Agrupación que usa la pantalla: vaciar tolva, repostar y volver a base son
// pausas del recorrido.
type Grupo = 'en_ruta' | 'pausa' | 'en_base' | 'sin_reporte';

const GRUPO_POR_CODIGO: Record<CodigoEstado, Grupo> = {
  '1': 'en_ruta',
  '2': 'pausa',
  '3': 'pausa',
  '4': 'pausa',
  '5': 'en_base',
};

const ETIQUETA_GRUPO: Record<Grupo, string> = {
  en_ruta: 'En ruta',
  pausa: 'En pausa',
  en_base: 'En base',
  sin_reporte: 'Sin reportes',
};

// estado_camion.estado -> texto legible (ver etiquetaEstadoCamion en el backend).
const ETIQUETA_HISTORIAL: Record<string, string> = {
  EN_RUTA: 'En ruta',
  VACIANDO_TOLVA: 'Vaciando tolva',
  RECONFIGURACION: 'Repostando',
  RETORNO: 'Volviendo a base',
  DISPONIBLE: 'En base',
};

function grupoDe(c: EstadoCamion): Grupo {
  return c.estado ? GRUPO_POR_CODIGO[c.estado] ?? 'sin_reporte' : 'sin_reporte';
}

function hace(iso: string | null): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';
  const minutos = Math.round((Date.now() - fecha.getTime()) / 60_000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h ${minutos % 60} min`;
  return fecha.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function fechaHora(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime())
    ? iso
    : fecha.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function mensajeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'No se pudo conectar con el servidor.';
}

export default function EstadoCamiones() {
  const [flota, setFlota] = useState<EstadoCamion[]>([]);
  const [rutas, setRutas] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [filtro, setFiltro] = useState<Grupo | 'todos'>('todos');

  const [seleccionado, setSeleccionado] = useState<EstadoCamion | null>(null);
  const [historial, setHistorial] = useState<RegistroEstado[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);

  const cargarFlota = useCallback(async () => {
    try {
      const respuesta = await apiRequest<{ data: EstadoCamion[] }>('/api/camion/estados');
      setFlota(respuesta.data ?? []);
      setError(null);
      setActualizado(new Date());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFlota();
    const intervalo = window.setInterval(cargarFlota, REFRESCO_MS);
    return () => window.clearInterval(intervalo);
  }, [cargarFlota]);

  // Nombres de las rutas: si falla, la tabla muestra "Ruta #id".
  useEffect(() => {
    apiRequest<{ data: RutaResumen[] }>('/api/rutas/')
      .then((r) => {
        const nombres: Record<number, string> = {};
        for (const ruta of r.data ?? []) nombres[ruta.ruta_id] = ruta.nombre;
        setRutas(nombres);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!seleccionado) return;
    let cancelado = false;
    apiRequest<{ data: RegistroEstado[] }>(`/api/camion/${seleccionado.camion_id}/estados?limite=30`)
      .then((r) => {
        if (!cancelado) setHistorial(r.data ?? []);
      })
      .catch((e) => {
        if (!cancelado) setErrorHistorial(mensajeError(e));
      })
      .finally(() => {
        if (!cancelado) setCargandoHistorial(false);
      });
    return () => {
      cancelado = true;
    };
  }, [seleccionado]);

  // El historial se vacía y se marca como cargando en el mismo clic: si no,
  // se ve un instante el del camión anterior o el aviso de "sin estados".
  const seleccionar = (camion: EstadoCamion) => {
    if (camion.camion_id === seleccionado?.camion_id) return;
    setHistorial([]);
    setErrorHistorial(null);
    setCargandoHistorial(true);
    setSeleccionado(camion);
  };

  const conteo = useMemo(() => {
    const c: Record<Grupo, number> = { en_ruta: 0, pausa: 0, en_base: 0, sin_reporte: 0 };
    for (const camion of flota) c[grupoDe(camion)]++;
    return c;
  }, [flota]);

  const visibles = useMemo(
    () => (filtro === 'todos' ? flota : flota.filter((c) => grupoDe(c) === filtro)),
    [flota, filtro],
  );

  const nombreRuta = (id: number | null) =>
    id == null ? '—' : rutas[id] ?? `Ruta #${id}`;

  const tarjetas: { grupo: Grupo; icono: ReactNode }[] = [
    { grupo: 'en_ruta', icono: <FiNavigation /> },
    { grupo: 'pausa', icono: <FiPauseCircle /> },
    { grupo: 'en_base', icono: <FiHome /> },
    { grupo: 'sin_reporte', icono: <FiWifiOff /> },
  ];

  return (
    <div className="estado-camiones-page">
      <header className="ec-header">
        <div className="ec-header-title">
          <h1>Estado de camiones</h1>
          <p>
            Lo que reporta cada conductor desde la app. Se actualiza cada 30 segundos
            {actualizado && <> · última consulta {actualizado.toLocaleTimeString('es-MX')}</>}
          </p>
        </div>
        <button type="button" className="ec-refresh" onClick={cargarFlota} disabled={cargando}>
          <FiRefreshCw /> Actualizar
        </button>
      </header>

      <section className="ec-stats">
        {tarjetas.map(({ grupo, icono }) => (
          <button
            type="button"
            key={grupo}
            className={`ec-stat ec-${grupo} ${filtro === grupo ? 'activo' : ''}`}
            onClick={() => setFiltro(filtro === grupo ? 'todos' : grupo)}
          >
            <span className="ec-stat-icon">{icono}</span>
            <span className="ec-stat-value">{conteo[grupo]}</span>
            <span className="ec-stat-label">{ETIQUETA_GRUPO[grupo]}</span>
          </button>
        ))}
      </section>

      {error && <div className="ec-error">{error}</div>}

      <section className="ec-tabla-contenedor">
        {cargando ? (
          <p className="ec-vacio">Cargando…</p>
        ) : visibles.length === 0 ? (
          <p className="ec-vacio">
            {flota.length === 0 ? 'No hay camiones registrados.' : 'Ningún camión en este estado.'}
          </p>
        ) : (
          <table className="ec-tabla">
            <thead>
              <tr>
                <th>Camión</th>
                <th>Estado</th>
                <th>Desde</th>
                <th>Ruta</th>
                <th>Conductor</th>
                <th>Último reporte</th>
                <th>Flota</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((c) => {
                const grupo = grupoDe(c);
                return (
                  <tr
                    key={c.camion_id}
                    className={seleccionado?.camion_id === c.camion_id ? 'seleccionado' : ''}
                    onClick={() => seleccionar(c)}
                  >
                    <td>
                      <div className="ec-camion">
                        <FiTruck />
                        <div>
                          <strong>{c.placa}</strong>
                          <span>{c.modelo}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`ec-badge ec-${grupo}`}>
                        {c.estado_nombre ?? ETIQUETA_GRUPO[grupo]}
                      </span>
                    </td>
                    <td>{hace(c.estado_desde)}</td>
                    <td>{nombreRuta(c.ruta_id)}</td>
                    <td>{c.conductor_nombre ?? (c.conductor_id ? `#${c.conductor_id}` : '—')}</td>
                    <td>{hace(c.actualizado_en)}</td>
                    <td className="ec-flota">{c.estado_flota}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {seleccionado && (
        <aside className="ec-panel">
          <div className="ec-panel-header">
            <div>
              <h2>{seleccionado.placa}</h2>
              <span>Historial de estados</span>
            </div>
            <button type="button" onClick={() => setSeleccionado(null)} aria-label="Cerrar">
              <FiX />
            </button>
          </div>
          {cargandoHistorial ? (
            <p className="ec-vacio">Cargando…</p>
          ) : errorHistorial ? (
            <div className="ec-error">{errorHistorial}</div>
          ) : historial.length === 0 ? (
            <p className="ec-vacio">Este camión aún no ha reportado estados.</p>
          ) : (
            <ol className="ec-historial">
              {historial.map((r, i) => (
                <li key={`${r.timestamp}-${i}`}>
                  <strong>{ETIQUETA_HISTORIAL[r.estado] ?? r.estado}</strong>
                  <span>
                    <FiClock /> {fechaHora(r.timestamp)}
                  </span>
                  {r.observaciones && <small>{r.observaciones}</small>}
                </li>
              ))}
            </ol>
          )}
        </aside>
      )}
    </div>
  );
}
