const BASE_URL = "";
const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";
const NAME_KEY = "auth_name";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getRole(): number | null {
  const raw = localStorage.getItem(ROLE_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function setRole(roleId: number): void {
  localStorage.setItem(ROLE_KEY, String(roleId));
}

export function clearRole(): void {
  localStorage.removeItem(ROLE_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export function setUserName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}

export function clearUserName(): void {
  localStorage.removeItem(NAME_KEY);
}

export function clearSession(): void {
  clearToken();
  clearRole();
  clearUserName();
}

export class ApiError extends Error {
  status: number;
  detalle: string;

  constructor(message: string, status: number, detalle = "") {
    super(message);
    this.status = status;
    this.detalle = detalle;
  }
}

const SIN_CONEXION = 0;

const MENSAJE_POR_STATUS: Record<number, string> = {
  [SIN_CONEXION]:
    "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
  401: "Tu sesión expiró o no es válida. Vuelve a iniciar sesión.",
  403: "No tienes permiso para realizar esta acción.",
  404: "No se encontró lo que buscas. Puede que se haya eliminado.",
  408: "El servidor tardó demasiado en responder. Inténtalo de nuevo.",
  413: "La información enviada es demasiado grande.",
  429: "Se hicieron demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.",
  500: "Ocurrió un error en el servidor. Si se repite, avisa al equipo técnico.",
  502: "El servidor no está disponible en este momento; puede estar reiniciándose. Inténtalo de nuevo en unos minutos.",
  503: "El servidor no está disponible en este momento; puede estar reiniciándose. Inténtalo de nuevo en unos minutos.",
  504: "El servidor tardó demasiado en responder. Inténtalo de nuevo en unos minutos.",
};

export function mensajeLegible(
  status: number,
  mensajeServidor?: string,
): string {
  if ([400, 409, 422].includes(status)) {
    const texto = mensajeServidor?.trim();
    const tecnico =
      !texto ||
      texto.length > 200 ||
      /json|unmarshal|sql|pq:|panic|runtime|[<>]|^\d{3}\b/i.test(texto);
    return tecnico
      ? "No se pudo completar la solicitud. Revisa los datos e inténtalo de nuevo."
      : texto;
  }
  return (
    MENSAJE_POR_STATUS[status] ??
    (status >= 500
      ? MENSAJE_POR_STATUS[500]
      : "No se pudo completar la solicitud. Inténtalo de nuevo.")
  );
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    console.error(`[api] ${path}: sin respuesta del servidor (${detalle})`);
    throw new ApiError(mensajeLegible(SIN_CONEXION), SIN_CONEXION, detalle);
  }

  const errorNgrok = response.headers.get("ngrok-error-code");
  if (errorNgrok) {
    console.error(`[api] ${path}: ngrok ${errorNgrok} (${response.status})`);
    throw new ApiError(mensajeLegible(503), 503, `ngrok ${errorNgrok}`);
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`.trim();
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?:
          | string
          | { message?: string; details?: { error?: string } | string };
      };

      if (typeof payload.error === "string") {
        message = payload.error;
      } else {
        const details = payload.error?.details;
        const detailText =
          typeof details === "string"
            ? details
            : typeof details === "object" && details?.error
              ? details.error
              : undefined;
        message =
          detailText ?? payload.error?.message ?? payload.message ?? message;
      }
    } catch {

    }

    if (response.status === 401) {
      clearSession();
    }

    if (response.status >= 500) {
      console.error(`[api] ${path}: ${response.status} ${message}`);
    }
    throw new ApiError(
      mensajeLegible(response.status, message),
      response.status,
      message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
