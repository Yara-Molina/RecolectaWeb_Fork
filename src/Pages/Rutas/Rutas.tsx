import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { apiRequest } from '../../services/api';
import { confirmarEliminacion } from '../../util/alertas';
import CrearRutaMapa from './CrearRutaMapa';
import './Rutas.css';

interface RutaItem {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  conductor_id: number | null;
  // Lo devuelve api_rutas: JSON con la geometria y los puntos. Llega como
  // objeto o como cadena segun el driver de MySQL, de ahi el union.
  json_ruta: string | { puntos?: unknown[] } | null;
  created_at: string;
}

export default function Rutas() {
  const [rutas, setRutas] = useState<RutaItem[]>([]);
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
        <CrearRutaMapa onRutaCreada={cargarRutas} />

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
                  <span className="ruta-puntos">{contarPuntos(ruta)} puntos</span>
                  <button
                    className="ruta-btn-eliminar"
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
