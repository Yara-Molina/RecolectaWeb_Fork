import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, Fragment } from "react";
import type { Coordenada } from "./geo";
import {
  SUCHIAPA_CENTER,
  SUCHIAPA_BOUNDS,
  LIMITAR_MAPA_A_SUCHIAPA,
} from "./constantes";
import { colorRuta } from "./coloresRuta";
import type { EstadoCamionMapa } from "./IconosCamion";
import type { ConductorEnVivo } from "../../../hooks/useTrackingWS";

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
    paradas?: Array<{
      orden: number;
      lat: number;
      lng: number;
      nombre?: string;
    }>;
  }>;
  rutaResaltadaId?: number | null;
  rutaEnfocadaId?: number | null;
  seleccionable?: boolean;
  puntos?: Coordenada[];
  trazaReal?: Coordenada[];
  onAgregarPunto?: (punto: Coordenada) => void;
}

function ClickParaPuntos({
  onAgregarPunto,
}: {
  onAgregarPunto: (punto: Coordenada) => void;
}) {
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
  trazaReal,
  onAgregarPunto,
}: MapaSuchiapaProps) {
  void camiones;

  const esTrazaReal = !!(trazaReal && trazaReal.length >= 2);
  const lineaPreview: Coordenada[] = esTrazaReal
    ? (trazaReal as Coordenada[])
    : puntos;

  const iconoParada = (numero: number, color: string) =>
    L.divIcon({
      html:
        `<div style="background:${color};color:#fff;width:24px;height:24px;` +
        "border-radius:50%;border:2px solid #fff;display:flex;align-items:center;" +
        "justify-content:center;font:700 12px/1 system-ui,sans-serif;" +
        `box-shadow:0 1px 4px rgba(0,0,0,.35)">${numero}</div>`,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  const truckIconFallback = L.divIcon({
    html: '<div style="font-size:40px;">🚛</div>',
    className: "",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });

  return (
    <MapContainer
      center={SUCHIAPA_CENTER}
      zoom={15}
      minZoom={LIMITAR_MAPA_A_SUCHIAPA ? 12 : 3}
      maxZoom={19}
      maxBounds={
        LIMITAR_MAPA_A_SUCHIAPA
          ? (SUCHIAPA_BOUNDS as [number, number][])
          : undefined
      }
      maxBoundsViscosity={LIMITAR_MAPA_A_SUCHIAPA ? 1.0 : undefined}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AjustarTamaño />

      {seleccionable && onAgregarPunto && (
        <ClickParaPuntos onAgregarPunto={onAgregarPunto} />
      )}

      {puntos.map((punto, index) => (
        <Marker
          key={index}
          position={punto}
          icon={iconoParada(index, index === 0 ? "#0F676C" : "#1E88E5")}
        >
          <Tooltip>{index === 0 ? "Base de inicio" : `Punto ${index}`}</Tooltip>
        </Marker>
      ))}

      {lineaPreview.length >= 2 && (
        <Polyline
          positions={lineaPreview}
          pathOptions={
            esTrazaReal
              ? { color: "#0F676C", weight: 4 }
              : { color: "#0F676C", weight: 3, opacity: 0.5, dashArray: "6 8" }
          }
        />
      )}

      {rutaConductor && rutaConductor.length >= 2 && (
        <Polyline
          positions={rutaConductor}
          pathOptions={{ color: "#E24B4A", weight: 4, opacity: 0.8 }}
        />
      )}

      {rutaEnfocadaId != null && (
        <EnfocarRuta
          key={`enfoque-${rutaEnfocadaId}`}
          puntos={
            rutasActivas.find((r) => r.ruta_id === rutaEnfocadaId)?.puntos ?? []
          }
        />
      )}

      {rutasActivas.map((ruta) => {
        const color = colorRuta(ruta.ruta_id);
        const resaltada = rutaResaltadaId === ruta.ruta_id;
        const hayResaltada = rutaResaltadaId != null;
        return ruta.puntos.length >= 2 ? (
          <Polyline
            key={`ruta-${ruta.ruta_id}`}
            positions={ruta.puntos}
            pathOptions={{
              color,
              weight: resaltada ? 8 : 5,
              opacity: !hayResaltada || resaltada ? 0.9 : 0.2,
            }}
          >
            {}
            <Tooltip sticky>
              <strong>{ruta.nombre}</strong>
              {ruta.conductorNombre ? <> · {ruta.conductorNombre}</> : null}
            </Tooltip>
          </Polyline>
        ) : null;
      })}

      {rutasActivas.flatMap((ruta) =>
        (ruta.paradas ?? []).map((parada) => (
          <Marker
            key={`parada-${ruta.ruta_id}-${parada.orden}`}
            position={[parada.lat, parada.lng]}
            icon={iconoParada(parada.orden, colorRuta(ruta.ruta_id))}
            opacity={
              rutaResaltadaId == null || rutaResaltadaId === ruta.ruta_id
                ? 1
                : 0.25
            }
          >
            <Tooltip>
              <strong>
                {parada.orden}. {parada.nombre || "Punto de recoleccion"}
              </strong>
              <br />
              {ruta.nombre}
            </Tooltip>
          </Marker>
        )),
      )}

      {conductoresEnVivo.map((c) => (
        <Fragment key={`conductor-group-${c.conductorId}`}>
          {c.recorrido && c.recorrido.length >= 2 && (
            <Polyline
              positions={c.recorrido}
              pathOptions={{ color: "#FF6B35", weight: 5, opacity: 0.85 }}
            />
          )}
          <Marker position={[c.lat, c.lng]} icon={truckIconFallback} />
        </Fragment>
      ))}
    </MapContainer>
  );
}

export type { CamionMapa };
