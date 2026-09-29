// components/Notificaciones/AvisoAnomalias.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { apiRequest } from '../../services/api';
import { canAccess } from '../../services/auth';
import { MENSAJE_CONECTADO, suscribirPanel } from '../../services/panelSocket';
import './AvisoAnomalias.css';

// El aviso llega al instante por WebSocket: ws_tracking difunde
// "recalculo_ruta" a los clientes "panel" cuando se crea una anomalía con
// ubicación y hay conductores en ruta. Esta consulta periódica solo es el
// respaldo para lo que no pasa por ahí (sin ubicación, sin conductores
// activos, o algún eslabón caído).
const INTERVALO_MS = 3 * 60_000;
const MAX_AVISOS = 3;
const CLAVE_ULTIMA_VISTA = 'anomalias_ultima_vista';

// Lo que emiten este componente y escuchan el Dashboard y Anomalías para
// recargar su lista.
export const EVENTO_ANOMALIAS_ACTUALIZADAS = 'anomalias:actualizadas';

interface AnomaliaResumen {
  anomalia_id: number;
  tipo_anomalia: string;
  descripcion: string;
  conductor_id: number | null;
}

function leerUltimaVista(): number | null {
  try {
    const valor = Number(localStorage.getItem(CLAVE_ULTIMA_VISTA));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function guardarUltimaVista(id: number) {
  try {
    localStorage.setItem(CLAVE_ULTIMA_VISTA, String(id));
  } catch {
    // Sin almacenamiento solo se pierde el aviso de lo llegado con la pestaña cerrada.
  }
}

/**
 * Avisa cuando llega un reporte nuevo (anomalía) y hace que las páginas que
 * muestran anomalías se actualicen solas. Vive en el layout, así que funciona
 * en cualquier página del panel. Comparte la conexión WebSocket del panel con
 * el mapa del Dashboard.
 */
export default function AvisoAnomalias() {
  const navigate = useNavigate();
  const [avisos, setAvisos] = useState<AnomaliaResumen[]>([]);
  // Mayor anomalia_id ya conocido. null hasta la primera consulta.
  const ultimaVista = useRef<number | null>(leerUltimaVista());
  const habilitado = canAccess('anomalias');

  const revisar = useCallback(async () => {
    let lista: AnomaliaResumen[];
    try {
      const respuesta = await apiRequest<{ data: AnomaliaResumen[] | null }>('/api/anomalias/');
      lista = respuesta.data ?? [];
    } catch {
      return; // Se reintenta en la siguiente vuelta.
    }

    const maximo = lista.reduce((m, a) => Math.max(m, a.anomalia_id), 0);
    const referencia = ultimaVista.current;

    // Primera vez en este navegador: no avisar de todo lo que ya existía.
    if (referencia === null) {
      ultimaVista.current = maximo;
      guardarUltimaVista(maximo);
      return;
    }

    const nuevas = lista
      .filter((a) => a.anomalia_id > referencia)
      .sort((a, b) => b.anomalia_id - a.anomalia_id);
    if (nuevas.length === 0) return;

    ultimaVista.current = maximo;
    guardarUltimaVista(maximo);
    setAvisos((actuales) => [...nuevas, ...actuales].slice(0, MAX_AVISOS));
    window.dispatchEvent(new CustomEvent(EVENTO_ANOMALIAS_ACTUALIZADAS));
  }, []);

  useEffect(() => {
    if (!habilitado) return;

    let intervalo: number | undefined;
    const iniciar = () => {
      window.clearInterval(intervalo);
      void revisar();
      intervalo = window.setInterval(revisar, INTERVALO_MS);
    };
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        window.clearInterval(intervalo);
      } else {
        iniciar();
      }
    };

    iniciar();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    // Revisión inmediata al llegar el aviso, y puesta al día al (re)conectar:
    // lo ocurrido con la conexión caída no se reenvía.
    const dejarSocket = suscribirPanel((mensaje) => {
      if (mensaje.type === 'recalculo_ruta' || mensaje.type === MENSAJE_CONECTADO) {
        void revisar();
      }
    });

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      dejarSocket();
    };
  }, [habilitado, revisar]);

  if (!habilitado || avisos.length === 0) return null;

  const cerrar = (id: number) =>
    setAvisos((actuales) => actuales.filter((a) => a.anomalia_id !== id));

  const verAnomalias = () => {
    setAvisos([]);
    navigate('/anomalias');
  };

  return (
    <div className="aviso-anomalias" role="status" aria-live="polite">
      {avisos.map((a) => (
        <div key={a.anomalia_id} className="aviso-anomalias-item">
          <FiAlertTriangle className="aviso-anomalias-icono" />
          <div className="aviso-anomalias-texto">
            <strong>
              {a.tipo_anomalia === 'REPORTE_CONDUCTOR' ? 'Nuevo reporte del conductor' : 'Nueva anomalía'}
              {a.conductor_id ? ` #${a.conductor_id}` : ''}
            </strong>
            <span>{a.descripcion || 'Sin descripción'}</span>
            <button type="button" className="aviso-anomalias-ver" onClick={verAnomalias}>
              Ver anomalías
            </button>
          </div>
          <button
            type="button"
            className="aviso-anomalias-cerrar"
            onClick={() => cerrar(a.anomalia_id)}
            aria-label="Cerrar aviso"
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}
