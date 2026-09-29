import { useEffect, useState } from 'react';
import { suscribirEstadoPanel, suscribirPanel } from '../services/panelSocket';

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


export function useTrackingWS() {
  const [conductores, setConductores] = useState<Map<number, ConductorEnVivo>>(new Map());
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const dejarEstado = suscribirEstadoPanel(setConectado);
    const dejarMensajes = suscribirPanel((data) => {
      if (data.type !== 'location_update') return;
      const conductorId = Number(data.conductor_id);
      const lat = Number(data.lat);
      const lng = Number(data.lng);

      setConductores((prev) => {
        const next = new Map(prev);
        const existing = next.get(conductorId);
        const recorrido: [number, number][] = existing?.recorrido || [];
        recorrido.push([lat, lng]);
        if (recorrido.length > 500) recorrido.shift();

        next.set(conductorId, {
          conductorId,
          lat,
          lng,
          velocidad: Number(data.velocidad) || 0,
          rumbo: Number(data.rumbo) || 0,
          enServicio: (data.en_servicio as boolean | undefined) ?? true,
          rutaId: (data.ruta_id as number | null | undefined) || null,
          timestamp: Number(data.timestamp) || Date.now(),
          recorrido,
        });
        return next;
      });
    });

    return () => {
      dejarMensajes();
      dejarEstado();
    };
  }, []);

  return { conductores: Array.from(conductores.values()), conectado };
}
