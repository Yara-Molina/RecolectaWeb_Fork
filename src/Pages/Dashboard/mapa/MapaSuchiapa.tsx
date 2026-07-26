import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Coordenada } from './geo';
import { SUCHIAPA_CENTER, SUCHIAPA_BOUNDS } from './constantes';
import type { EstadoCamionMapa } from './IconosCamion';

interface CamionMapa {
  id: string;
  nombre: string;
  color: string;
  estadoIcono: EstadoCamionMapa;
  ruta: Coordenada[];
}

interface MapaSuchiapaProps {
  camiones: CamionMapa[];
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

export default function MapaSuchiapa({ camiones, seleccionable, puntos = [], onAgregarPunto }: MapaSuchiapaProps) {
  void camiones;

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
    </MapContainer>
  );
}

export type { CamionMapa };
