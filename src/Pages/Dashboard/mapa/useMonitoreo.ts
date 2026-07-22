import { useEffect, useState } from 'react';
import type { Coordenada } from './geo';

function calcularPorcentajeAvance(ruta: Coordenada[], indiceActual: number): number {
  if (ruta.length < 2) return 0;
  const avance = Math.max(0, Math.min(indiceActual, ruta.length - 1));
  return Number(((avance / (ruta.length - 1)) * 100).toFixed(0));
}

function obtenerRutaRecorrida(ruta: Coordenada[], indiceActual: number): Coordenada[] {
  return ruta.slice(0, Math.min(indiceActual + 1, ruta.length));
}

export function useMonitoreo(ruta: Coordenada[], intervaloMs = 1200) {
  const [indiceActual, setIndiceActual] = useState(0);
  const [posicionCamion, setPosicionCamion] = useState<Coordenada | null>(null);

  useEffect(() => {
    if (ruta.length < 2) {
      setIndiceActual(0);
      setPosicionCamion(ruta[0] ?? null);
      return;
    }

    setIndiceActual(0);
    setPosicionCamion(ruta[0]);

    const intervalo = window.setInterval(() => {
      setIndiceActual((prev) => {
        const siguiente = prev + 1;
        if (siguiente >= ruta.length) {
          return 0;
        }
        return siguiente;
      });
    }, intervaloMs);

    return () => window.clearInterval(intervalo);
  }, [ruta, intervaloMs]);

  useEffect(() => {
    if (ruta.length === 0) {
      setPosicionCamion(null);
      return;
    }
    setPosicionCamion(ruta[Math.min(indiceActual, ruta.length - 1)]);
  }, [indiceActual, ruta]);

  const rutaRecorrida = obtenerRutaRecorrida(ruta, indiceActual);
  const porcentajeAvance = calcularPorcentajeAvance(ruta, indiceActual);

  return { posicionCamion, rutaRecorrida, porcentajeAvance };
}
