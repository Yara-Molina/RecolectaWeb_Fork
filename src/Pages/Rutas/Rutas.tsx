import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import './Rutas.css';

interface RutaItem {
  ruta_id: number;
  nombre: string;
  descripcion: string;
  conductor_id: number | null;
  json_ruta: any;
  created_at: string;
}

export default function Rutas() {
  const [rutas, setRutas] = useState<RutaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_RUTA_URL || '';

  const cargarRutas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/rutas/activas`);
      if (!res.ok) return;
      const json = await res.json();
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
    if (!window.confirm('¿Eliminar esta ruta?')) return;
    try {
      await fetch(`${apiUrl}/rutas/${id}`, { method: 'DELETE' });
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
          <p>Listado de rutas creadas desde el Dashboard</p>
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
