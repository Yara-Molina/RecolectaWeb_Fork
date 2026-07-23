import type { Coordenada } from './geo';

export interface DireccionCompleta {
  display_name: string;
  calle?: string;
  cp?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
}

export async function obtenerDireccionCompleta([lat, lng]: Coordenada): Promise<DireccionCompleta | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  try {
    const respuesta = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!respuesta.ok) return null;

    const datos = await respuesta.json();
    const address = datos?.address || {};

    return {
      display_name: datos?.display_name || '',
      calle: address.road || address.street || address.pedestrian || null,
      cp: address.postcode || null,
      colonia: address.neighbourhood || address.suburb || null,
      municipio: address.city || address.town || address.municipality || null,
      estado: address.state || null,
    };
  } catch {
    return null;
  }
}

export async function obtenerDireccion([lat, lng]: Coordenada): Promise<string> {
  const resultado = await obtenerDireccionCompleta([lat, lng]);
  return resultado?.display_name || '';
}

