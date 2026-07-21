import type { Coordenada } from './geo';

export async function obtenerDireccion([lat, lng]: Coordenada): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  try {
    const respuesta = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!respuesta.ok) return '';

    const datos = await respuesta.json();
    return typeof datos?.display_name === 'string' ? datos.display_name : '';
  } catch {
    return '';
  }
}
