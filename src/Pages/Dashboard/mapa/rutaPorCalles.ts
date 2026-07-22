import type { Coordenada } from './geo';

export async function calcularRutaPorCalles(puntos: Coordenada[]): Promise<Coordenada[]> {
  if (puntos.length < 2) return puntos;

  const coords = puntos.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const respuesta = await fetch(url);
  if (!respuesta.ok) return puntos;

  const datos = await respuesta.json();
  const geometria = datos?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(geometria)) return puntos;

  return geometria.map(([lng, lat]: [number, number]) => [lat, lng] as Coordenada);
}