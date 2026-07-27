import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState, Fragment } from 'react';
import type { Coordenada } from './geo';
import { SUCHIAPA_CENTER, SUCHIAPA_BOUNDS } from './constantes';
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
  rutasActivas?: Array<{ruta_id: number; nombre: string; conductor_id: number | null; puntos: Coordenada[]}>;
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

export default function MapaSuchiapa({
  camiones,
  conductoresEnVivo = [],
  rutaConductor,
  rutasActivas = [],
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
  }, [puntos]);

  return (
    <MapContainer
      center={SUCHIAPA_CENTER}
      zoom={13}
      minZoom={12}
      maxZoom={18}
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

      {rutasActivas.map((ruta, idx) => {
        const colores = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#D81B60', '#6D4C41'];
        const color = colores[idx % colores.length];
        return ruta.puntos.length >= 2 ? (
          <Polyline
            key={`ruta-${ruta.ruta_id}`}
            positions={ruta.puntos}
            pathOptions={{ color, weight: 5, opacity: 0.9 }}
          />
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
