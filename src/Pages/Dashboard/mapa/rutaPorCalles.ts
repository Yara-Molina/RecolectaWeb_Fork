import type { Coordenada } from './geo';

// El perfil `driving` de OSRM trae `continue_straight=true`: en cada punto
// intermedio obliga a seguir en la direccion de llegada y prohibe el giro en U.
// Cuando el punto siguiente queda hacia atras, la unica salida es rodear la
// manzana entera, y el trazo dejaba de concordar con el sentido del carril que
// el administrador marco al colocar el punto. Con `false` se permite el giro
// en el waypoint y la linea pasa por delante del punto.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const OSRM_PARAMS = 'overview=full&geometries=geojson&continue_straight=false';

export async function calcularRutaPorCalles(puntos: Coordenada[]): Promise<Coordenada[]> {
  if (puntos.length < 2) return puntos;

  const coords = puntos.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE}/${coords}?${OSRM_PARAMS}`;

  const respuesta = await fetch(url);
  if (!respuesta.ok) return puntos;

  const datos = await respuesta.json();
  const geometria = datos?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(geometria)) return puntos;

  return geometria.map(([lng, lat]: [number, number]) => [lat, lng] as Coordenada);
}
