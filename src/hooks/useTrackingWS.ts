import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '../services/api';

export interface ConductorEnVivo {
  conductorId: number;
  lat: number;
  lng: number;
  velocidad: number;
  rumbo: number;
  enServicio: boolean;
  rutaId: number | null;
  timestamp: number;
  recorrido: [number, number][];
}

/**
 * Hook que se conecta al WebSocket como "ciudadano" (oyente)
 * y recibe las ubicaciones en vivo de los conductores.
 */
export function useTrackingWS() {
  const [conductores, setConductores] = useState<Map<number, ConductorEnVivo>>(new Map());
  const [conectado, setConectado] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conectar = useCallback(() => {
    const token = getToken();
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const url = `${wsUrl}?token=${encodeURIComponent(token)}&role=ciudadano`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConectado(true);
        console.log('[TrackingWS] Conectado');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'location_update') {
            setConductores(prev => {
              const next = new Map(prev);
              const existing = next.get(data.conductor_id);
              const recorrido: [number, number][] = existing?.recorrido || [];
              recorrido.push([data.lat, data.lng]);
              // Limitar a últimos 500 puntos para no saturar memoria
              if (recorrido.length > 500) recorrido.shift();

              next.set(data.conductor_id, {
                conductorId: data.conductor_id,
                lat: data.lat,
                lng: data.lng,
                velocidad: data.velocidad || 0,
                rumbo: data.rumbo || 0,
                enServicio: data.en_servicio ?? true,
                rutaId: data.ruta_id || null,
                timestamp: data.timestamp || Date.now(),
                recorrido,
              });
              return next;
            });
          }
        } catch (e) {
          // Ignorar mensajes no JSON
        }
      };

      ws.onclose = () => {
        setConectado(false);
        console.log('[TrackingWS] Desconectado, reconectando en 5s...');
        reconnectTimer.current = setTimeout(conectar, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.error('[TrackingWS] Error:', e);
    }
  }, []);

  useEffect(() => {
    conectar();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [conectar]);

  return { conductores: Array.from(conductores.values()), conectado };
}
