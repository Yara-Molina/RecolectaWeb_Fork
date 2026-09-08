import { useEffect, useState } from 'react';
import { FiTrash2, FiEdit2, FiPower } from 'react-icons/fi';
import { apiRequest } from '../../services/api';
import { confirmar, confirmarEliminacion, alertaError } from '../../util/alertas';
import CrearRutaMapa, { type RutaEnEdicion } from './CrearRutaMapa';
import './Rutas.css';

interface RutaItem {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  conductor_id: number | null;
  activa?: boolean | number;
  // Lo devuelve api_rutas: JSON con la geometria y los puntos. Llega como
  // objeto o como cadena segun el driver de MySQL, de ahi el union.
  json_ruta: string | { puntos?: unknown[] } | null;
  created_at: string;
}

export default function Rutas() {
  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [rutaEnEdicion, setRutaEnEdicion] = useState<RutaEnEdicion | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarRutas = async () => {
    setLoading(true);
    try {
      // Via gin-backend: valida el JWT y reenvia a api_rutas, que es el dueño
      // de las rutas. Llamar a api_rutas directo no funciona -- solo escucha
      // en la red interna.
      const json = await apiRequest<RutaItem[] | { data: RutaItem[] }>('/api/rutas/');
      if (Array.isArray(json)) {
        setRutas(json);
      } else if (Array.isArray(json.data)) {
        setRutas(json.data);
      }
    } catch (err) {
      console.error('Error cargando rutas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  const esActiva = (ruta: RutaItem) => ruta.activa === true || ruta.activa === 1;

  // Solo se permite desactivar: reactivar podria dejar dos rutas activas para
  // el mismo conductor, que es justo lo que la restriccion evita.
  const desactivarRuta = async (ruta: RutaItem) => {
    const ok = await confirmar(
      `¿Desactivar "${ruta.nombre}"?`,
      'El conductor dejara de verla en la app. Podras asignarle otra ruta despues.',
      'Desactivar',
    );
    if (!ok) return;
    try {
      await apiRequest(`/api/rutas/${ruta.ruta_id}`, {
        method: 'PUT',
        body: JSON.stringify({ activa: false }),
      });
      await cargarRutas();
    } catch (err) {
      console.error('Error desactivando ruta:', err);
      alertaError('No se pudo desactivar la ruta', 'Intentalo de nuevo en unos segundos.');
    }
  };

  const editarPuntos = async (ruta: RutaItem) => {
    try {
      const res = await apiRequest<{ success: boolean; data: Array<{ lat: number; lon: number; nombre?: string; direccion?: string; es_inicio?: boolean | number }> }>(
        `/api/puntos-recoleccion/ruta/${ruta.ruta_id}`,
      );
      // La base se reanade sola al entrar en edicion, asi que aqui se excluye.
      const puntos = (res.data ?? [])
        .filter((p) => !(p.es_inicio === true || p.es_inicio === 1))
        .map((p) => ({ lat: p.lat, lng: p.lon, nombre: p.nombre, direccion: p.direccion }));

      setRutaEnEdicion({
        ruta_id: ruta.ruta_id,
        nombre: ruta.nombre,
        conductor_id: ruta.conductor_id,
        puntos,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error cargando puntos de la ruta:', err);
      alertaError('No se pudieron cargar los puntos', 'Intentalo de nuevo en unos segundos.');
    }
  };

  const eliminarRuta = async (id: number) => {
    const ok = await confirmarEliminacion(
      '¿Eliminar esta ruta?',
      'Se borrarán también sus puntos de recolección. Esta acción no se puede deshacer.',
    );
    if (!ok) return;
    try {
      await apiRequest(`/api/rutas/${id}`, { method: 'DELETE' });
      setRutas(prev => prev.filter(r => r.ruta_id !== id));
    } catch (err) {
      console.error('Error eliminando ruta:', err);
    }
  };

  const contarPuntos = (ruta: RutaItem): number => {
    try {
      const json = typeof ruta.json_ruta === 'string' ? JSON.parse(ruta.json_ruta) : ruta.json_ruta;
      if (Array.isArray(json?.puntos)) return json.puntos.length;
      if (Array.isArray(json)) return json.length;
      return 0;
    } catch {
      return 0;
    }
  };

  return (
    <div className="rutas-page">
      <div className="rutas-container">
        <header className="rutas-header">
          <h1>Rutas</h1>
          <p>Crea rutas sobre el mapa y consulta las existentes</p>
        </header>

        {/* Al crear una ruta se recarga el listado, para no dejarlo desfasado. */}
        <CrearRutaMapa
          onRutaCreada={() => {
            setRutaEnEdicion(null);
            cargarRutas();
          }}
          rutaEnEdicion={rutaEnEdicion}
          onCancelarEdicion={() => setRutaEnEdicion(null)}
        />

        <section className="rutas-panel">
          <header className="rutas-panel-head">
            <h2>Rutas creadas</h2>
            {!loading && rutas.length > 0 && (
              <span className="rutas-panel-contador">
                {rutas.length} ruta{rutas.length === 1 ? '' : 's'}
              </span>
            )}
          </header>

          <div className="rutas-list">
            {loading && <p className="rutas-empty">Cargando rutas...</p>}
            {!loading && rutas.length === 0 && <p className="rutas-empty">No hay rutas creadas aún.</p>}
            {rutas.map(ruta => (
              <div key={ruta.ruta_id} className="ruta-item">
                <div className="ruta-item-left">
                  <span className="ruta-nombre">{ruta.nombre}</span>
                  {ruta.descripcion && <span className="ruta-desc">{ruta.descripcion}</span>}
                </div>
                <div className="ruta-item-right">
                  <span className={`ruta-estado ${esActiva(ruta) ? 'ruta-estado--activa' : ''}`}>
                    {esActiva(ruta) ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="ruta-puntos">{contarPuntos(ruta)} puntos</span>
                  <button
                    className="ruta-btn"
                    onClick={() => editarPuntos(ruta)}
                    aria-label={`Editar puntos de ${ruta.nombre}`}
                    title="Editar puntos"
                  >
                    <FiEdit2 />
                  </button>
                  {esActiva(ruta) && (
                    <button
                      className="ruta-btn"
                      onClick={() => desactivarRuta(ruta)}
                      aria-label={`Desactivar ${ruta.nombre}`}
                      title="Desactivar ruta"
                    >
                      <FiPower />
                    </button>
                  )}
                  <button
                    className="ruta-btn ruta-btn-eliminar"
                    onClick={() => eliminarRuta(ruta.ruta_id)}
                    aria-label={`Eliminar ${ruta.nombre}`}
                    title="Eliminar ruta"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
