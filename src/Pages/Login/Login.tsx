// Login.jsx o Login.tsx
import { useState } from 'react';
import './Login.css'; 
import Logo from '../../Assets/Logo.png';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setToken, setRole } from '../../services/api';

interface LoginResponse {
  token?: string;
  access_token?: string;
  jwt?: string;
  data?: {
    rol_id?: number;
  };
}

export default function Login() {
  const [emailOrAlias, setEmailOrAlias] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
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

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas.');
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
            {error && (
              <div className="login-error" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

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
              <input
                type="password"
                id="contrasena"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
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


