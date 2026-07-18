# Informe de conexión Frontend ↔ Backend — Recolecta

Fecha: 2026-07-11
Backend revisado: `gin-backend` (Go/Gin), código fuente en `233298_recolecta_web/gin-backend/src`.
Frontend revisado: `233298_recolecta_web/frontend/src`.

Este informe resume qué pantallas quedaron conectadas a la API real, cuáles se dejaron con datos de prueba (mock) a propósito, y cuáles no se pueden conectar todavía porque el backend no tiene el módulo correspondiente. También lista los problemas de backend/base de datos encontrados en el camino.

---

## 1. Pantallas conectadas a la API real

| Pantalla | Endpoint(s) | Estado |
|---|---|---|
| Login | `POST /api/empleados/login` | Funciona. Guarda el token JWT y navega a `/dashboard`. |
| Administración → Empleados | `GET/POST/PATCH/DELETE /api/empleados` | Funciona. Requiere rol `ADMIN`. |
| Administración → Camiones | `GET/POST/PUT/DELETE /api/camion` + `GET /api/tipo-camion` (catálogo) | Funciona. Requiere rol `CONDUCTOR`, `SUPERVISOR` o `COORDINADOR` (**no** `ADMIN`, ver sección 4). |
| Administración → Rellenos Sanitarios | `GET/POST/PUT/DELETE /api/relleno-sanitario` | Código correcto, pero **fallaba** porque la tabla `relleno_sanitario` no existía en la base de datos. Ver sección 4a — ya con el `CREATE TABLE` corriendo en tu Postgres, debería funcionar. |
| Anomalías | `GET/POST/PUT/DELETE /api/anomalias` | Reescrita en esta conversación. Estados reales: `PENDIENTE`, `EN_PROCESO`, `RESUELTA`. Requiere rol `ADMIN`, `SUPERVISOR` o `COORDINADOR`. |
| Puntos de Ruta (EstadoRuta) | `GET /api/rutas` (solo lectura, para el selector) + `GET/POST/PUT/DELETE /api/puntos-recoleccion` | Reescrita en esta conversación. Se quitaron latitud/longitud/dirección/estado porque el backend no los maneja; el punto real solo tiene `ruta_id`, `cp` y `eliminado`. Depende del fix de columnas en la sección 4d. Requiere rol `CONDUCTOR`, `SUPERVISOR` o `COORDINADOR`. |

## 2. Pantallas dejadas con datos mock (decisión tuya, no hay endpoint equivalente)

| Pantalla | Por qué se quedó mock |
|---|---|
| Administración → Días de Recolección | No existe ningún módulo en el backend para esto (ni tabla, ni ruta, ni entidad). Habría que construirlo desde cero. |
| Alertas | El módulo de alertas del frontend (mecánica/clima/tráfico/acceso, por ruta y vehículo) no coincide con nada del backend. Lo más parecido es `alertas-mantenimiento`, pero ese es otro dominio (mantenimiento preventivo de camiones, no incidentes de ruta) y ni siquiera tiene pantalla propia en el frontend todavía. |

## 3. Pantallas que no se pueden conectar sin trabajo nuevo de backend

| Pantalla | Por qué no hay match |
|---|---|
| Historial | Necesita, por punto de recolección: dirección, fecha, hora, conductor, vehículo, ruta y un estado (`completado`/`en-proceso`/`retrasado`/`pendiente`). El backend no tiene ninguna entidad que registre "se recolectó este punto, en este momento, con este resultado". Lo más cercano son `registro_vaciado` (cuándo un camión-ruta vació en un relleno), `ruta_camion` (qué camión llevó qué ruta en qué fecha) e `historial_asignacion` (qué chofer manejó qué camión). Combinando esas tres se podría inferir "qué camión y chofer corrieron una ruta un día dado", pero **no** el estado por punto ni la hora de visita a cada punto — esa granularidad no existe. Conectar esta pantalla de verdad requiere una tabla nueva tipo `visita_punto_recoleccion` o similar. |
| Validación de Recolección | Mismo problema: no existe el concepto de "aprobar/rechazar una recolección" en el backend. Ningún endpoint permite marcar un registro como validado/rechazado/en revisión. |
| Dashboard | No hay un endpoint de resumen (`/dashboard/resumen` o similar). Los contadores (rutas activas, camiones, anomalías, alertas) sí se podrían armar combinando `GET /api/rutas/activas`, `GET /api/camion`, `GET /api/anomalias` y `GET /api/alertas-mantenimiento/pendientes`, pero el mapa con las rutas dibujadas no tiene ningún dato geográfico real detrás (`punto_recoleccion` no tiene coordenadas) — seguiría siendo ilustrativo. No lo toqué porque mezclaría datos reales con un mapa inventado, lo cual puede ser más confuso que útil; avísame si quieres que arme al menos los contadores con datos reales. |

## 4. Problemas de backend/base de datos encontrados

### a. Tabla `relleno_sanitario` no existe
No aparece en `db_script.sql`, `db_constraints.sql`, `db_indexes.sql` ni en los seeds, aunque el código Go (`PostgresRellenoSanitario.go`) sí la consulta. Se agregó la definición a `db_script.sql` como documentación; falta correr esto contra la base real:

```sql
CREATE TABLE IF NOT EXISTS relleno_sanitario (
  relleno_id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255),
  es_rentado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  capacidad_toneladas NUMERIC(12,2) NOT NULL DEFAULT 0
);
```

### b. El rol `ADMIN` no tiene acceso a varios catálogos
Las rutas `/api/camion`, `/api/rutas` y `/api/puntos-recoleccion` solo permiten `CONDUCTOR`, `SUPERVISOR` y `COORDINADOR` — `ADMIN` está excluido en el middleware `RequireRole(...)`. Si pruebas con una cuenta admin vas a recibir 403 en esas pantallas aunque todo lo demás esté bien. Probablemente no fue intencional; vale la pena que el equipo de backend agregue `core.ADMIN` a esas listas.

### c. Documentación Swagger de "Ruta" incorrecta
Los comentarios `@Param`/`@Success` de `createRuta_controller.go` y `updateRuta_controller.go` apuntan por error a `entities.CreateEstadoCamionRequest` / `entities.EstadoCamionResponse` (el esquema de Estado de Camión), no a un esquema propio de Ruta. Es un bug de copiar/pegar en la documentación; el código real que procesa el body sí es distinto (`nombre`, `descripcion`, `json_ruta`, `created_at`). Falta corregir las anotaciones para que Swagger deje de mostrar información equivocada.

### d. Columnas de `ruta` y `punto_recoleccion` desactualizadas en el script
`db_script.sql` define estas tablas con columnas viejas (`id`, `direccion`, `deleted_at`, `colonia_id NOT NULL`) que no coinciden con lo que el código Go realmente consulta (`ruta_id`/`punto_id`, `cp`, `eliminado`). Si tu base de datos real sigue el esquema del script, las pantallas de Rutas/Puntos de Ruta van a fallar. Ajuste sugerido:

```sql
-- Tabla ruta
ALTER TABLE ruta RENAME COLUMN id TO ruta_id;
ALTER TABLE ruta ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ruta ALTER COLUMN colonia_id DROP NOT NULL;
UPDATE ruta SET eliminado = (deleted_at IS NOT NULL);

-- Tabla punto_recoleccion
ALTER TABLE punto_recoleccion RENAME COLUMN id TO punto_id;
ALTER TABLE punto_recoleccion RENAME COLUMN direccion TO cp;
ALTER TABLE punto_recoleccion ADD COLUMN IF NOT EXISTS eliminado BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE punto_recoleccion SET eliminado = (deleted_at IS NOT NULL);
```

Nota: si tu base ya fue migrada aparte (como parece ser el caso de `camion`, que sí trae `camion_id`/`disponibilidad_id`/`eliminado`), puede que `ruta` y `punto_recoleccion` ya estén al día también y este punto no aplique. Solo lo vas a saber corriendo la app y viendo si el error es "columna no existe" o no.

### e. Posible inconsistencia de roles en "Empleados"
`EmpleadosPage.tsx` filtra como "empleados" a quienes tienen `rol_id === 4` (`COORDINADOR` según `core/roles.go`), no `rol_id === 1` (`ADMIN`). No lo cambié porque no sé cuál era la intención original, pero vale la pena confirmarlo con el equipo de backend — si "Empleados" debía mostrar a todo el personal (sin importar rol) o a otro rol específico, el filtro actual lo estaría ocultando.

---

## Resumen rápido

- **Conectado y debería funcionar ya:** Login, Empleados, Camiones.
- **Conectado, pendiente de un fix de base de datos que ya te di:** Rellenos Sanitarios, Puntos de Ruta (posiblemente).
- **Mock a propósito (sin backend):** Días de Recolección, Alertas.
- **No conectable sin backend nuevo:** Historial, Validación de Recolección, Dashboard (parcialmente conectable si quieres solo los contadores).
