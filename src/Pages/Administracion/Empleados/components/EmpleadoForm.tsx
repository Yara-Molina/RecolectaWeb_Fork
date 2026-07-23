import { useState } from "react";
import { FiEye, FiEyeOff, FiSave, FiX } from "react-icons/fi";
import type { Empleado, EmpleadoFormValues } from "../EmpleadosPage";
import { ROLES, ROLE_NAMES, type RoleId } from "../../../../services/auth";

interface Props {
  modo: "CREAR" | "EDITAR";
  empleado: Empleado | null;
  onCancel: () => void;
  onSave: (data: EmpleadoFormValues) => void;
  saving?: boolean;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,68}$/;
const PASSWORD_HINT = "Minimo 8 caracteres maximo 68, con al menos una mayúscula, una minúscula y un número.";

const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const EMAIL_MIN = 6;
const EMAIL_MAX = 254;

// Solo letras (incluye acentos y ñ) y espacios; nada de números ni
// caracteres especiales en nombre/apellidos.
const soloLetras = (raw: string) => raw.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");

export default function EmpleadoForm({ modo, empleado, onCancel, onSave, saving = false }: Props) {
  const [nombre, setNombre] = useState(() => empleado?.nombre ?? "");
  const [apellidos, setApellidos] = useState(() => empleado?.apellidos ?? "");
  const [mail, setMail] = useState(() => empleado?.email ?? "");
  const [username, setUsername] = useState(() => empleado?.username ?? "");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rolId, setRolId] = useState<RoleId>(() => (empleado?.rolId as RoleId) ?? ROLES.CONDUCTOR);
  const [error, setError] = useState<string | null>(null);

  const passwordHint = modo === "EDITAR" ? `Déjala en blanco para no cambiarla. ${PASSWORD_HINT}` : PASSWORD_HINT;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Evita que Enter en un input dispare el submit del formulario mientras
    // se está llenando; solo se envía con clic explícito en "Crear empleado".
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!apellidos.trim()) return setError("Los apellidos son obligatorios.");
    if (!mail.trim()) return setError("El correo es obligatorio.");
    if (mail.trim().length < EMAIL_MIN) return setError(`El correo debe tener al menos ${EMAIL_MIN} caracteres.`);
    if (mail.trim().length > EMAIL_MAX) return setError(`El correo no puede superar ${EMAIL_MAX} caracteres.`);
    if (!username.trim()) return setError("El usuario es obligatorio.");
    if (username.trim().length < USERNAME_MIN) return setError(`El usuario debe tener al menos ${USERNAME_MIN} caracteres.`);
    if (username.trim().length > USERNAME_MAX) return setError(`El usuario no puede superar ${USERNAME_MAX} caracteres.`);

    if (modo === "CREAR" && !password) return setError("La contraseña es obligatoria.");
    if (password && !PASSWORD_REGEX.test(password)) {
      return setError(`La contraseña no cumple el formato. ${PASSWORD_HINT}`);
    }

    onSave({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      mail: mail.trim(),
      username: username.trim(),
      password,
      rol_id: rolId,
    });
  };

  return (
    <form className="emp-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      {error && <div className="emp-alert">{error}</div>}

      <div className="emp-form-grid">
        <div className="emp-field emp-full">
          <label>Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(soloLetras(e.target.value))}
            placeholder="Ej: Juan Conductor"
            maxLength={100}
          />
        </div>

        <div className="emp-field emp-full">
          <label>Apellidos</label>
          <input
            value={apellidos}
            onChange={(e) => setApellidos(soloLetras(e.target.value))}
            placeholder="Ej: Pérez López"
            maxLength={100}
          />
        </div>

        <div className="emp-field emp-full">
          <label>Correo</label>
          <input
            type="email"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            placeholder="Ej: juan@recolecta.mx"
            minLength={EMAIL_MIN}
            maxLength={EMAIL_MAX}
          />
        </div>

        <div className="emp-field emp-full">
          <label>Usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: jperez"
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
          />
        </div>

        <div className="emp-field emp-full">
          <label>Contraseña</label>
          <div className="emp-password-field">
            <input
              type={mostrarPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={modo === "EDITAR" ? "Dejar en blanco para no cambiar" : "Contraseña de acceso"}
              maxLength={68}
            />
            <button
              type="button"
              className="emp-password-toggle"
              onClick={() => setMostrarPassword((v) => !v)}
              tabIndex={-1}
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <span className="emp-field-hint">{passwordHint}</span>
        </div>

        <div className="emp-field emp-full">
          <label>Rol</label>
          <select value={rolId} onChange={(e) => setRolId(Number(e.target.value) as RoleId)}>
            {(Object.entries(ROLE_NAMES) as [string, string][]).map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="emp-form-actions">
        <button type="button" className="emp-btn secondary" onClick={onCancel} disabled={saving}>
          <FiX />
          <span>Cancelar</span>
        </button>

        <button type="submit" className="emp-btn primary" disabled={saving}>
          <FiSave />
          <span>{saving ? "Guardando..." : modo === "CREAR" ? "Crear empleado" : "Guardar cambios"}</span>
        </button>
      </div>
    </form>
  );
}
