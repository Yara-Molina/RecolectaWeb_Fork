// src/services/auth.ts
// Mapa de permisos por rol para el frontend. Los valores de ROLES coinciden
// exactamente con src/core/roles.go del backend (gin-backend), y las listas
// de SECTION_ROLES reflejan lo que cada endpoint real permite según
// RequireRole(...) en cada *_routes.go (ver INFORME_CONEXION_API.md para el
// detalle de por qué cada rol tiene o no acceso).
import { getRole } from "./api";

export const ROLES = {
  ADMIN: 1,
  CONDUCTOR: 2,
  SUPERVISOR: 3,
  COORDINADOR: 4,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_NAMES: Record<RoleId, string> = {
  1: "Administrador",
  2: "Conductor",
  3: "Supervisor",
  4: "Coordinador",
};

export type SectionKey =
  | "dashboard"
  | "historial"
  | "alertas"
  | "anomalias"
  | "estadoRuta"
  | "validacionRecoleccion"
  | "administracion"
  | "administracionRellenos"
  | "administracionCamiones"
  | "administracionDiasRecoleccion"
  | "administracionEmpleados";

// Secciones "de solo lectura"/informativas (Dashboard, Historial) que no
// tienen un endpoint protegido propio: se dejan visibles para cualquier
// cuenta autenticada, sin importar el rol.
const TODOS_LOS_ROLES: RoleId[] = [ROLES.ADMIN, ROLES.CONDUCTOR, ROLES.SUPERVISOR, ROLES.COORDINADOR];

export const SECTION_ROLES: Record<SectionKey, RoleId[]> = {
  dashboard: TODOS_LOS_ROLES,
  historial: TODOS_LOS_ROLES,

  // /api/anomalias/ -> RequireRole(ADMIN, SUPERVISOR, COORDINADOR)
  anomalias: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // No conectado a un endpoint real todavía; se deja para el mismo grupo
  // que revisa incidentes (Anomalías).
  alertas: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // /api/rutas/ y /api/puntos-recoleccion/ -> RequireRole(CONDUCTOR, SUPERVISOR, COORDINADOR)
  // (ADMIN queda excluido por el propio backend)
  estadoRuta: [ROLES.CONDUCTOR, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // No conectado a un endpoint real; validar el trabajo de los choferes es
  // tarea de quien supervisa/coordina.
  validacionRecoleccion: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // Contenedor: visible si el rol tiene acceso a al menos una sub-sección.
  administracion: TODOS_LOS_ROLES,

  // /api/relleno-sanitario/ -> RequireRole(SUPERVISOR, COORDINADOR, CONDUCTOR)
  administracionRellenos: [ROLES.CONDUCTOR, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // /api/camion/ -> RequireRole(CONDUCTOR, SUPERVISOR, COORDINADOR)
  administracionCamiones: [ROLES.CONDUCTOR, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // No existe endpoint en el backend; se deja visible para el mismo grupo
  // administrativo que gestiona rutas/camiones/rellenos.
  administracionDiasRecoleccion: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.COORDINADOR],

  // /api/empleados -> RequireRole(ADMIN) exclusivamente
  administracionEmpleados: [ROLES.ADMIN],
};

// Orden en el que se intenta redirigir a la primera sub-sección accesible
// de "Administración" (usado por el índice de AdministracionLayout).
// "administracionDiasRecoleccion" se deja fuera a propósito: la vista sigue
// existiendo (ver AppRouter.tsx) pero no se ofrece como redirección hasta
// que se implemente del todo.
export const ADMINISTRACION_SUBSECCIONES: { key: SectionKey; path: string }[] = [
  { key: "administracionRellenos", path: "rellenos" },
  { key: "administracionCamiones", path: "camiones" },
  { key: "administracionEmpleados", path: "empleados" },
];

export function canAccess(section: SectionKey, roleId: number | null = getRole()): boolean {
  if (!roleId) return false;
  return SECTION_ROLES[section].includes(roleId as RoleId);
}

export function roleName(roleId: number | null = getRole()): string {
  if (!roleId || !(roleId in ROLE_NAMES)) return "Usuario";
  return ROLE_NAMES[roleId as RoleId];
}

export function firstAccessibleAdminPath(roleId: number | null = getRole()): string | null {
  const found = ADMINISTRACION_SUBSECCIONES.find((s) => canAccess(s.key, roleId));
  return found ? found.path : null;
}
