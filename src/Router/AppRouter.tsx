// AppRouter.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "../Pages/Login/Login";
import Navbar from "../components/Navigation/Navbar";
import { RequireAuth, RequireRole } from "./Guards";
import { firstAccessibleAdminPath } from "../services/auth";

// Páginas globales
import Dashboard from "../Pages/Dashboard/Dashboard";
import Historial from "../Pages/Historial/Historial";
import Anomalias from "../Pages/Anomalias/Anomalias";
import EstadoRuta from "../Pages/EstadoRuta/EstadoRuta";
import Rutas from "../Pages/Rutas/Rutas";

// Páginas sin conectar todavía (ver src/Pages/_inactive/README.md)
import Alertas from "../Pages/_inactive/Alertas/Alertas";
import ValidacionRecoleccion from "../Pages/_inactive/ValidacionRecoleccion/ValidacionRecoleccion";

// ==========================
// ADMINISTRACIÓN (NUEVO)
// ==========================

import AdministracionLayout from "../Pages/Administracion/AdministracionLayout";
import RellenosSanitariosPage from "../Pages/Administracion/RellenosSanitarios/RellenosSanitariosPage";
import CamionesPage from "../Pages/Administracion/Camiones/CamionesPage";
import EmpleadosPage from "../Pages/Administracion/Empleados/EmpleadosPage";
import DispositivosPage from "../Pages/Administracion/Dispositivos/DispositivosPage";

// Sin conectar todavía (ver src/Pages/_inactive/README.md)
import DiasRecoleccionPage from "../Pages/_inactive/DiasRecoleccion/DiasRecoleccionPage";

// Layout global (Navbar + contenido)
function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// El índice de /administracion no siempre puede ir a "rellenos": ese
// apartado no es visible para todos los roles. Se manda a la primera
// sub-sección que el rol de la cuenta sí puede ver (o a /dashboard si
// no tiene acceso a ninguna).
function AdministracionIndex() {
  const path = firstAccessibleAdminPath();
  return <Navigate to={path ?? "/dashboard"} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login sin navbar */}
        <Route path="/login" element={<Login />} />

        {/* ==========================
            RUTAS CON NAVBAR (GLOBAL)
           ========================== */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rutas" element={<Rutas />} />
          <Route path="/historial" element={<Historial />} />
          <Route
            path="/alertas"
            element={
              <RequireRole section="alertas">
                <Alertas />
              </RequireRole>
            }
          />
          <Route
            path="/anomalias"
            element={
              <RequireRole section="anomalias">
                <Anomalias />
              </RequireRole>
            }
          />
          <Route
            path="/estado-ruta"
            element={
              <RequireRole section="estadoRuta">
                <EstadoRuta />
              </RequireRole>
            }
          />
          <Route
            path="/validacion-recoleccion"
            element={
              <RequireRole section="validacionRecoleccion">
                <ValidacionRecoleccion />
              </RequireRole>
            }
          />

          {/* ==========================
              ADMINISTRACIÓN (Nested)
             ========================== */}
          <Route path="/administracion" element={<AdministracionLayout />}>
            <Route index element={<AdministracionIndex />} />
            <Route
              path="rellenos"
              element={
                <RequireRole section="administracionRellenos">
                  <RellenosSanitariosPage />
                </RequireRole>
              }
            />
            <Route
              path="camiones"
              element={
                <RequireRole section="administracionCamiones">
                  <CamionesPage />
                </RequireRole>
              }
            />
            <Route
              path="dias-recoleccion"
              element={
                <RequireRole section="administracionDiasRecoleccion">
                  <DiasRecoleccionPage />
                </RequireRole>
              }
            />
            <Route
              path="empleados"
              element={
                <RequireRole section="administracionEmpleados">
                  <EmpleadosPage />
                </RequireRole>
              }
            />
            <Route
              path="dispositivos"
              element={
                <RequireRole section="administracionDispositivos">
                  <DispositivosPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}