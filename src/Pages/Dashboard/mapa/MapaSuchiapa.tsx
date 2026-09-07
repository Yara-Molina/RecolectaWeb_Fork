import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState, Fragment } from 'react';
import type { Coordenada } from './geo';
import { SUCHIAPA_CENTER, SUCHIAPA_BOUNDS } from './constantes';
import { colorRuta } from './coloresRuta';
import type { EstadoCamionMapa } from './IconosCamion';
import { calcularRutaPorCalles } from './rutaPorCalles';
import type { ConductorEnVivo } from '../../../hooks/useTrackingWS';

interface CamionMapa {
  id: string;
  nombre: string;
  color: string;
  estadoIcono: EstadoCamionMapa;
  ruta: Coordenada[];
}

interface MapaSuchiapaProps {
  camiones: CamionMapa[];
  conductoresEnVivo?: ConductorEnVivo[];
  rutaConductor?: Coordenada[];
  rutasActivas?: Array<{
    ruta_id: number;
    nombre: string;
    conductor_id: number | null;
    conductorNombre?: string;
    puntos: Coordenada[];
  }>;
  /** Ruta sobre la que esta el cursor en la leyenda: se engrosa y las demas se atenuan. */
  rutaResaltadaId?: number | null;
  /** Ruta a la que encuadrar el mapa al pulsarla en la leyenda. */
  rutaEnfocadaId?: number | null;
  seleccionable?: boolean;
  puntos?: Coordenada[];
  onAgregarPunto?: (punto: Coordenada) => void;
}

function ClickParaPuntos({ onAgregarPunto }: { onAgregarPunto: (punto: Coordenada) => void }) {
  useMapEvents({
    click(e) {
      onAgregarPunto([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

function AjustarTamaño() {
  const map = useMap();
  const contenedorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    contenedorRef.current = map.getContainer();

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(contenedorRef.current);

    const timeout = window.setTimeout(() => map.invalidateSize(), 250);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [map]);

  return null;
}

/** Encuadra el mapa sobre una ruta. Se remonta al cambiar la ruta enfocada
 *  (via key), que es lo que dispara el ajuste. */
function EnfocarRuta({ puntos }: { puntos: Coordenada[] }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length >= 2) {
      map.fitBounds(puntos as [number, number][], { padding: [40, 40] });
    }
  }, [puntos, map]);
  return null;
}

export default function MapaSuchiapa({
  camiones,
  conductoresEnVivo = [],
  rutaConductor,
  rutasActivas = [],
  rutaResaltadaId = null,
  rutaEnfocadaId = null,
  seleccionable,
  puntos = [],
  onAgregarPunto,
}: MapaSuchiapaProps) {
  void camiones;

  const [rutaCalles, setRutaCalles] = useState<Coordenada[]>([]);

  const truckIconFallback = L.divIcon({
    html: '<div style="font-size:40px;">🚛</div>',
    className: '',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

  // Se depende del CONTENIDO y no de la identidad del array: cualquier padre
  // que construya `puntos` en linea lo recrearia en cada render y este efecto
  // entraria en bucle (Maximum update depth exceeded).
  const puntosKey = puntos.map((p) => `${p[0]},${p[1]}`).join('|');

  useEffect(() => {
    if (puntos.length < 2) {
      setRutaCalles([]);
      return;
    }

    let cancelado = false;

    calcularRutaPorCalles(puntos).then((resultado) => {
      if (!cancelado) setRutaCalles(resultado);
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntosKey]);

  return (
    <MapContainer
      center={SUCHIAPA_CENTER}
      zoom={15}
      minZoom={12}
      maxZoom={19}
      maxBounds={SUCHIAPA_BOUNDS as [number, number][]}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AjustarTamaño />

      {seleccionable && onAgregarPunto && <ClickParaPuntos onAgregarPunto={onAgregarPunto} />}

      {puntos.map((punto, index) => (
        <Marker key={index} position={punto} />
      ))}

      {rutaCalles.length >= 2 && (
        <Polyline positions={rutaCalles} pathOptions={{ color: '#0F676C', weight: 4 }} />
      )}

      {rutaConductor && rutaConductor.length >= 2 && (
        <Polyline positions={rutaConductor} pathOptions={{ color: '#E24B4A', weight: 4, opacity: 0.8 }} />
      )}

      {rutaEnfocadaId != null && (
        <EnfocarRuta
          key={`enfoque-${rutaEnfocadaId}`}
          puntos={rutasActivas.find((r) => r.ruta_id === rutaEnfocadaId)?.puntos ?? []}
        />
      )}

      {rutasActivas.map((ruta) => {
        // Color estable por ruta_id (ver coloresRuta.ts), no por posición.
        const color = colorRuta(ruta.ruta_id);
        const resaltada = rutaResaltadaId === ruta.ruta_id;
        const hayResaltada = rutaResaltadaId != null;
        return ruta.puntos.length >= 2 ? (
          <Polyline
            key={`ruta-${ruta.ruta_id}`}
            positions={ruta.puntos}
            pathOptions={{
              color,
              // Atenuar las demas es lo que hace legible una ruta concreta
              // cuando varias comparten calles.
              weight: resaltada ? 8 : 5,
              opacity: !hayResaltada || resaltada ? 0.9 : 0.2,
            }}
          >
            {/* sticky: la etiqueta sigue al cursor a lo largo del trazo, que
                es lo util cuando varias rutas se solapan en la misma calle. */}
            <Tooltip sticky>
              <strong>{ruta.nombre}</strong>
              {ruta.conductorNombre ? <> · {ruta.conductorNombre}</> : null}
            </Tooltip>
          </Polyline>
        ) : null;
      })}

      {conductoresEnVivo.map((c) => (
        <Fragment key={`conductor-group-${c.conductorId}`}>
          {c.recorrido && c.recorrido.length >= 2 && (
            <Polyline positions={c.recorrido} pathOptions={{ color: '#FF6B35', weight: 5, opacity: 0.85 }} />
          )}
          <Marker
            position={[c.lat, c.lng]}
            icon={truckIconFallback}
          />
        </Fragment>
      ))}
    </MapContainer>
  );
}

export type { CamionMapa };
