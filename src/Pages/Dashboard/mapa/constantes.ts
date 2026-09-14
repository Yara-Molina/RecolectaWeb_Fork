import type { Coordenada } from './geo';

// Centro real del pueblo de Suchiapa: la base, los puntos y todas las rutas
// caen en ~16.625, -93.105. El valor anterior (16.73, -93.12) apuntaba unos
// 11 km al norte, así que los mapas abrían fuera del pueblo.
export const SUCHIAPA_CENTER: Coordenada = [16.6255, -93.105];

// Límites acotados alrededor del pueblo (con margen), para que la vista se
// mantenga siempre sobre Suchiapa y no se pueda desplazar lejos.
export const SUCHIAPA_BOUNDS: [Coordenada, Coordenada] = [
  [16.585, -93.15],
  [16.665, -93.06],
];
