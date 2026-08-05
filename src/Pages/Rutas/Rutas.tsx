import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import './Rutas.css';

// Respuesta de GET https://api-rutas.practicasoftware.fun/rutas
interface RutaItem {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  conductor_id: number | null;
  json_ruta: any;
  eliminado: number | boolean;
  created_at: string;
}

function apiRutasBase(): string {
  // En dev, vite proxyea /rutas -> API_RUTA_URL. En prod (o sin proxy),
  // VITE_API_RUTA_URL apunta a https://api-rutas.practicasoftware.fun
  const absolute = (import.meta.env.VITE_API_RUTA_URL || '').replace(/\/$/, '');
  return absolute || '';
}

export default function Rutas() {
  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarRutas = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = apiRutasBase();
      const res = await fetch(`${base}/rutas`);
      if (!res.ok) {
        setError(`No se pudieron cargar las rutas (${res.status}).`);
        return;
      }
      const json = await res.json();
      const lista: RutaItem[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
          ? json.data
          : [];
      setRutas(lista.filter((r) => !r.eliminado));
    } catch (err) {
      console.error('Error cargando rutas:', err);
      setError('No se pudieron cargar las rutas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarRutas();
  }, []);

  const eliminarRuta = async (id: number) => {
    if (!window.confirm('¿Eliminar esta ruta?')) return;
    try {
      const base = apiRutasBase();
      const res = await fetch(`${base}/rutas/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert(`No se pudo eliminar la ruta (${res.status}).`);
        return;
      }
      setRutas((prev) => prev.filter((r) => r.ruta_id !== id));
    } catch (err) {
      console.error('Error eliminando ruta:', err);
      alert('No se pudo eliminar la ruta.');
    }
  };

  const contarPuntos = (ruta: RutaItem): number => {
    try {
      const json = typeof ruta.json_ruta === 'string' ? JSON.parse(ruta.json_ruta) : ruta.json_ruta;
      if (Array.isArray(json?.puntos)) return json.puntos.length;
      if (Array.isArray(json?.coordinates)) return json.coordinates.length;
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
          <p>Listado de rutas creadas desde el Dashboard</p>
        </header>

        <div className="rutas-list">
          {loading && <p className="rutas-empty">Cargando rutas...</p>}
          {!loading && error && <p className="rutas-empty">{error}</p>}
          {!loading && !error && rutas.length === 0 && (
            <p className="rutas-empty">No hay rutas creadas aún.</p>
          )}
          {rutas.map((ruta) => (
            <div key={ruta.ruta_id} className="ruta-item">
              <div className="ruta-item-left">
                <span className="ruta-nombre">{ruta.nombre}</span>
                {ruta.descripcion && <span className="ruta-desc">{ruta.descripcion}</span>}
              </div>
              <div className="ruta-item-right">
                <span className="ruta-puntos">{contarPuntos(ruta)} puntos</span>
                <button className="ruta-btn-eliminar" onClick={() => eliminarRuta(ruta.ruta_id)}>
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
