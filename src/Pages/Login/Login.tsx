import { useState } from 'react';
import './Login.css';
import Logo from '../../assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { ApiError, apiRequest, setToken, setRole, setUserName } from '../../services/api';
import AlertaError from '../../components/Notificaciones/AlertaError';
import { errorLegible, type ErrorLegible } from '../../components/Notificaciones/errorLegible';

interface LoginResponse {
  token?: string;
  access_token?: string;
  jwt?: string;
  data?: {
    rol_id?: number;
    nombre?: string;
    apellidos?: string;
  };
}

export default function Login() {
  const [emailOrAlias, setEmailOrAlias] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState<ErrorLegible | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest<LoginResponse>('/api/empleados/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailOrAlias, password: contrasena }),
      });

      const token = data.token ?? data.access_token ?? data.jwt ?? '';
      if (token) {
        setToken(token);
      }

      if (typeof data.data?.rol_id === 'number') {
        setRole(data.data.rol_id);
      }

      const fullName = [data.data?.nombre, data.data?.apellidos].filter(Boolean).join(' ').trim();
      if (fullName) {
        setUserName(fullName);
      }

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError({
          titulo: 'No se pudo iniciar sesión',
          mensaje: 'El correo, usuario o contraseña no son correctos.',
          tipo: 'usuario',
        });
      } else {
        setError(errorLegible(err, 'No se pudo iniciar sesión'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Sección izquierda: Login */}
      <div className="login-left">
        <div className="login-box">
          <h1 className="login-title">BIENVENIDO</h1>
          
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <AlertaError error={error} onCerrar={() => setError(null)} />}

            <div className="input-group">
              <label htmlFor="nombre">Correo o usuario</label>
              <input
                type="text"
                id="nombre"
                value={emailOrAlias}
                onChange={(e) => setEmailOrAlias(e.target.value)}
                placeholder="Ingresa tu correo o usuario"
                required
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="contrasena">Contraseña</label>
              <div className="password-field">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  id="contrasena"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  tabIndex={-1}
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarContrasena ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'CARGANDO...' : 'ACEPTAR'}
            </button>
          </form>

          
        </div>
      </div>

      {/* Sección derecha: Logo e información */}
      <div className="login-right">
        <div className="logo-container">
          {/* Aquí puedes poner tu imagen */}
          <div className="logo-placeholder">
            <img src={Logo} alt="Logo" />
          </div>
          <h2 className="app-title">RECOLECTA</h2>
        </div>
        
        <div className="terminos-info">
          <p>
            Sistema de Gestión de Recolección de Residuos Sólidos.
            <br />
            Para acceder al sistema, debes aceptar los términos de uso.
          </p>
        </div>
      </div>
    </div>
  );
}


