// src/Router/Guards.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";
import { canAccess, type SectionKey } from "../services/auth";

// Exige que haya una sesión (token) activa. Si no la hay, manda a /login.
export function RequireAuth({ children }: { children: JSX.Element }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Exige sesión + que el rol de la cuenta tenga acceso a esa sección.
// Si no hay sesión manda a /login; si hay sesión pero el rol no alcanza,
// manda a /dashboard (que sí es visible para cualquier rol autenticado).
export function RequireRole({ section, children }: { section: SectionKey; children: JSX.Element }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  if (!canAccess(section)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
