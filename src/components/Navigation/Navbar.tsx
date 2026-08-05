import { NavLink, useNavigate } from 'react-router-dom';
import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import './Navbar.css';
import Logo from '../../assets/Logo.png';
import { clearSession, getUserName } from '../../services/api';
import { canAccess, roleName, type SectionKey } from '../../services/auth';

interface NavItem {
  id: string;
  label: string;
  path: string;
  section?: SectionKey;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const userModalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!userModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserModalOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (userModalRef.current && !userModalRef.current.contains(event.target as Node)) {
        setUserModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userModalOpen]);

  const allNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', section: 'dashboard' },
    { id: 'historial', label: 'Historial', path: '/historial', section: 'historial' },
    { id: 'anomalias', label: 'Anomalias', path: '/anomalias', section: 'anomalias' },
    { id: 'rutas', label: 'Rutas', path: '/rutas' },
    { id: 'Puntos_de_ruta', label: 'Puntos de Ruta', path: '/estado-ruta', section: 'estadoRuta' },
    { id: 'Administracion', label: 'Administración', path: '/administracion', section: 'administracion' },
  ];

  // Solo se muestran los apartados a los que el rol de la cuenta tiene acceso.
  const navItems = useMemo(() => allNavItems.filter((item) => !item.section || canAccess(item.section)), []);

  const handleLogout = () => {
    setUserModalOpen(false);
    clearSession();
    navigate('/login');
  };

  const userName = getUserName();

  return (
    <div className="anomalias-nav-container">
      <nav className={`anomalias-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="anomalias-navbar-inner">

          <div className="anomalias-navbar-left">
            <img src={Logo} alt="Logo Recolecta" className="anomalias-navbar-logo" />
          </div>

          <div className="anomalias-navbar-center">
            {navItems.map((item) => (
              <Fragment key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `anomalias-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </Fragment>
            ))}
          </div>

          <div className="anomalias-navbar-right" ref={userModalRef}>
            <button
              type="button"
              onClick={() => setUserModalOpen((open) => !open)}
              className="anomalias-nav-user-icon"
              title="Cuenta"
              aria-haspopup="dialog"
              aria-expanded={userModalOpen}
            >
              👤
            </button>

            {userModalOpen && (
              <div className="anomalias-user-modal" role="dialog" aria-modal="true">
                <div className="anomalias-user-modal-avatar">👤</div>
                <div className="anomalias-user-modal-name">{userName ?? 'Usuario'}</div>
                <div className="anomalias-user-modal-role">{roleName()}</div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="anomalias-user-modal-logout"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>
    </div>
  );
}
