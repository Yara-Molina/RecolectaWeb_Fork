import { NavLink } from "react-router-dom";
import { FaTrashAlt, FaTruck, FaUsers } from "react-icons/fa";
import "./SidebarAdministracion.css";
import { canAccess } from "../../services/auth";

export default function SidebarAdministracion() {
  return (
    <aside className="admin-sidebar-wrapper">
      <nav className="admin-nav">
        {canAccess("administracionRellenos") && (
          <NavLink
            to="/administracion/rellenos"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
            title="Rellenos Sanitarios"
          >
            <FaTrashAlt />
          </NavLink>
        )}

        {canAccess("administracionCamiones") && (
          <NavLink
            to="/administracion/camiones"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
            title="Camiones"
          >
            <FaTruck />
          </NavLink>
        )}

        {/* Días de Recolección: oculto del sidebar por ahora (pendiente de
            implementar), pero la ruta y la vista se dejan intactas. */}

        {canAccess("administracionEmpleados") && (
          <NavLink
            to="/administracion/empleados"
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
            title="Empleados"
          >
            <FaUsers />
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
