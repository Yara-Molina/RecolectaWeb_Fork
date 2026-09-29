import { getRole, getToken } from "./api";
import { ROLES } from "./auth";

export const MENSAJE_CONECTADO = "__conectado";

export interface MensajePanel {
  type: string;
  [clave: string]: unknown;
}

type OyenteMensaje = (mensaje: MensajePanel) => void;
type OyenteEstado = (conectado: boolean) => void;

const RECONEXION_MS = 5000;

const oyentes = new Set<OyenteMensaje>();
const oyentesEstado = new Set<OyenteEstado>();
let ws: WebSocket | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let conectado = false;

function rolDeConexion(): "panel" | "ciudadano" {
  const rol = getRole();
  return rol === ROLES.ADMIN ||
    rol === ROLES.COORDINADOR ||
    rol === ROLES.SUPERVISOR
    ? "panel"
    : "ciudadano";
}

function cambiarEstado(valor: boolean) {
  conectado = valor;
  oyentesEstado.forEach((o) => o(valor));
}

function abrir() {
  const token = getToken();
  if (!token || oyentes.size === 0) return;

  const base = import.meta.env.VITE_WS_URL || "ws://localhost:8080";
  const url = `${base}?token=${encodeURIComponent(token)}&role=${rolDeConexion()}`;

  try {
    const socket = new WebSocket(url);
    ws = socket;

    socket.onopen = () => {
      cambiarEstado(true);
      oyentes.forEach((o) => o({ type: MENSAJE_CONECTADO }));
    };

    socket.onmessage = (evento) => {
      let mensaje: MensajePanel;
      try {
        mensaje = JSON.parse(evento.data);
      } catch {
        return;
      }
      oyentes.forEach((o) => o(mensaje));
    };

    socket.onclose = () => {
      if (ws !== socket) return;
      ws = null;
      cambiarEstado(false);
      if (oyentes.size > 0) temporizador = setTimeout(abrir, RECONEXION_MS);
    };

    socket.onerror = () => socket.close();
  } catch (e) {
    console.error("[panelSocket] Error:", e);
  }
}

function cerrar() {
  if (temporizador) clearTimeout(temporizador);
  temporizador = null;
  const socket = ws;
  ws = null;
  socket?.close();
  cambiarEstado(false);
}

export function suscribirPanel(oyente: OyenteMensaje): () => void {
  oyentes.add(oyente);
  if (!ws && !temporizador) abrir();
  else if (conectado) oyente({ type: MENSAJE_CONECTADO });

  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) cerrar();
  };
}

export function suscribirEstadoPanel(oyente: OyenteEstado): () => void {
  oyentesEstado.add(oyente);
  oyente(conectado);
  return () => {
    oyentesEstado.delete(oyente);
  };
}
