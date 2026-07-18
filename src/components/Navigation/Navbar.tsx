import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import './Navbar.css';
import Logo from '../../Assets/Logo.png';
import { clearSession } from '../../services/api';
import { canAccess, roleName, type SectionKey } from '../../services/auth';

interface NavItem {
  id: string;
  label: string;
  path: string;
  section?: SectionKey;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', section: 'dashboard' },
    { id: 'historial', label: 'Historial', path: '/historial', section: 'historial' },
    { id: 'alertas', label: 'Alertas', path: '/alertas', section: 'alertas' },
    { id: 'anomalias', label: 'Anomalias', path: '/anomalias', section: 'anomalias' },
    { id: 'Puntos_de_ruta', label: 'Puntos de Ruta', path: '/estado-ruta', section: 'estadoRuta' },
    // Validación de Recolección: oculta del navbar por ahora (pendiente de
    // implementar), pero la ruta y la vista se dejan intactas.
    { id: 'Administracion', label: 'Administración', path: '/administracion', section: 'administracion' },
  ];

  // Solo se muestran los apartados a los que el rol de la cuenta tiene acceso.
  const navItems = useMemo(() => allNavItems.filter((item) => !item.section || canAccess(item.section)), []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="anomalias-nav-container">
      <nav className={`anomalias-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="anomalias-navbar-inner">

          <div className="anomalias-navbar-left">
            <img src={Logo} alt="Logo Recolecta" className="anomalias-navbar-logo" />
          </div>

          <div className="anomalias-navbar-center">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `anomalias-nav-link ${isActive ? 'active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="anomalias-navbar-right">
            <span style={{ marginRight: 12, fontSize: 13, opacity: 0.85 }}>{roleName()}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="anomalias-nav-user-icon"
              style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
              title="Cerrar sesión"
            >
              👤
            </button>
          </div>

        </div>
      </nav>
    </div>
  );
}
