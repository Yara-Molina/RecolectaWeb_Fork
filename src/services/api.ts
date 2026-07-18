// Las rutas son siempre relativas: en dev las resuelve el proxy de Vite
// (ver vite.config.mjs) y en producción el proxy de nginx. Así el navegador
// nunca llama directo al dominio del backend y no hay preflight de CORS.
const BASE_URL = "";
const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";



export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// rol_id tal como lo maneja el backend (src/core/roles.go):
// ADMIN=1, CONDUCTOR=2, SUPERVISOR=3, COORDINADOR=4.
// Se guarda aparte del token porque el JWT no se decodifica en el frontend;
// el rol viene directo en la respuesta de /api/empleados/login (data.rol_id).
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

export function clearSession(): void {
  clearToken();
  clearRole();
}

// El backend responde errores en dos formas distintas según el middleware:
// - JWT/roles (401/403): { "error": "texto" }
// - RespondError (400/500): { "error": { "code", "message", "details" } }
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as {
        message?: string;
        error?: string | { message?: string };
      };

      if (typeof payload.error === "string") {
        message = payload.error;
      } else {
        message = payload.error?.message ?? payload.message ?? message;
      }
    } catch {

    }

    if (response.status === 401) {
      // El token ya no sirve (expiró o es inválido): limpiamos toda la sesión
      // (token + rol) para no seguir mandando peticiones condenadas a fallar
      // ni mostrando secciones de un rol que ya no es válido.
      clearSession();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
