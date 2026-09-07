// Color de cada ruta en el mapa.
//
// Se deriva del ruta_id y no de la posición en la lista: así una ruta conserva
// su color entre recargas y aunque cambie el orden en que llegan del backend.
// Con colores por índice, añadir o quitar una ruta activa repintaba todas las
// demás y la leyenda dejaba de coincidir con lo que el usuario recordaba.

// Tonos separados en matiz y con suficiente contraste sobre el gris claro del
// mapa base de OpenStreetMap.
const PALETA = [
  '#E53935', // rojo
  '#1E88E5', // azul
  '#43A047', // verde
  '#FB8C00', // naranja
  '#8E24AA', // morado
  '#00ACC1', // cian
  '#D81B60', // rosa
  '#6D4C41', // marrón
] as const;

export function colorRuta(rutaId: number): string {
  // Math.abs por si algún id llegara negativo; el resto es un reparto simple
  // y estable sobre la paleta.
  return PALETA[Math.abs(rutaId) % PALETA.length];
}

export const PALETA_RUTAS = PALETA;
