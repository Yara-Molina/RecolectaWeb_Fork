import L from 'leaflet';
import camionVerde from '../../../assets/camion-verde.png';
import camionAmarillo from '../../../assets/camion-amarillo.png';
import camionRojo from '../../../assets/camion-rojo.png';
import camionNaranja from '../../../assets/camion-naranja.png';
import camionNegro from '../../../assets/camion-negro.png';

export type EstadoCamionMapa = 'activo' | 'retrasado' | 'parado' | 'mantenimiento' | 'fallido';

export function obtenerIconoCamion(estado: EstadoCamionMapa) {
  let iconoUrl = camionVerde;

  switch (estado) {
    case 'activo':
      iconoUrl = camionVerde;
      break;
    case 'retrasado':
      iconoUrl = camionAmarillo;
      break;
    case 'parado':
      iconoUrl = camionRojo;
      break;
    case 'mantenimiento':
      iconoUrl = camionNaranja;
      break;
    case 'fallido':
      iconoUrl = camionNegro;
      break;
  }

  return new L.Icon({
    iconUrl: iconoUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
