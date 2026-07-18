# Recolecta Web

Frontend administrativo de Recolecta construido con React 19, TypeScript, Vite 7 y React Router. Permite iniciar sesion contra `API_recolecta`, navegar por secciones protegidas por rol y consumir endpoints administrativos de rutas, puntos, anomalías, camiones, rellenos sanitarios y empleados.

Este proyecto es independiente de `Mapa-Rec`. No importa archivos de `Mapa-Rec` ni comparte su configuracion. Ambos proyectos pueden apuntar al mismo backend, pero cada uno tiene su propio `.env`, servicios y Vite config.

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Backend `API_recolecta` corriendo localmente o expuesto mediante URL accesible

## Instalacion

```bash
npm install
```

## Configuracion de entorno

El proyecto mantiene dos archivos de entorno versionables:

```txt
.env.example
.env.development
```

`.env.example` documenta desarrollo y produccion. `.env.development` se usa para desarrollo y pruebas con Vite.

Si necesitas variables locales propias, crea un `.env` en la raiz del proyecto a partir del ejemplo:

```bash
cp .env.example .env
```

Desarrollo recomendado:

```env
ALLOW_ALL_HOSTS=true
ALLOWED_HOSTS=
API_PROXY_TARGET=http://localhost:8081
VITE_API_URL=
VITE_API_PROXY_TARGET=
```

Produccion:

```env
ALLOW_ALL_HOSTS=false
ALLOWED_HOSTS=frontend.example.com,www.example.com
API_PROXY_TARGET=http://localhost:8081
VITE_API_URL=
VITE_API_PROXY_TARGET=
```

`ALLOWED_HOSTS` debe contener solo hosts separados por comas, sin `https://`, rutas ni diagonales finales.

Si el backend corre en `8080`:

```env
VITE_API_URL=
API_PROXY_TARGET=http://localhost:8080
```

Si usas ngrok:

```env
VITE_API_URL=
API_PROXY_TARGET=https://TU-SUBDOMINIO.ngrok-free.app
```

En desarrollo se recomienda dejar `VITE_API_URL` vacio. El frontend llama a `/api/...` y Vite reenvia esas peticiones al backend definido en `API_PROXY_TARGET`. Esto evita problemas CORS.

El proxy conserva compatibilidad con variables anteriores. La prioridad es:

```txt
API_PROXY_TARGET -> VITE_API_PROXY_TARGET -> VITE_API_URL -> http://localhost:8081
```

Llamada directa, solo si la API permite CORS:

```env
VITE_API_URL=http://localhost:8081
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Los scripts usan explicitamente:

```txt
vite.config.mjs
```

`vite.config.ts` se mantiene alineado, pero el archivo usado por `npm run dev`, `npm run build` y `npm run preview` es `vite.config.mjs`.

## Configuracion Vite

Archivo usado:

```txt
vite.config.mjs
```

Responsabilidades:

- cargar `.env` con `loadEnv`
- usar `API_PROXY_TARGET || VITE_API_PROXY_TARGET || VITE_API_URL || http://localhost:8081`
- configurar proxy `/api`
- permitir todos los hosts solo cuando `ALLOW_ALL_HOSTS=true`
- restringir hosts en produccion usando `ALLOWED_HOSTS`
- impedir que produccion arranque con `ALLOW_ALL_HOSTS=true` o sin hosts configurados
- agregar `ngrok-skip-browser-warning: 1` cuando se usa ngrok

Con esta configuracion, una llamada del frontend a:

```txt
/api/empleados/login
```

puede ser reenviada por Vite a:

```txt
http://localhost:8081/api/empleados/login
```

o al valor configurado en `API_PROXY_TARGET`.

## Estructura principal

```txt
src/
  App.tsx
  main.tsx
  Router/
    AppRouter.tsx
    Guards.tsx
  services/
    api.ts
    auth.ts
  components/
    Navigation/
      Navbar.tsx
      Navbar.css
  Pages/
    Login/
    Dashboard/
    Historial/
    Alertas/
    Anomalias/
    EstadoRuta/
    ValidacionRecoleccion/
    Administracion/
      RellenosSanitarios/
      Camiones/
      DiasRecoleccion/
      Empleados/
  modules/
    RellenoSanitario.ts
    DiadeRecoleccion.ts
```

## Flujo de autenticacion

Pantalla:

```txt
src/Pages/Login/Login.tsx
```

Servicio base:

```txt
src/services/api.ts
```

Endpoint:

```txt
POST /api/empleados/login
```

Body:

```json
{
  "email": "usuario@recolecta.mx",
  "password": "password"
}
```

Respuesta esperada:

```json
{
  "message": "login correcto",
  "token": "jwt...",
  "data": {
    "rol_id": 1
  }
}
```

El frontend guarda:

```txt
localStorage.auth_token
localStorage.auth_role
```

`auth_token` se envia en peticiones protegidas como:

```txt
Authorization: Bearer TOKEN
```

`auth_role` se usa para decidir que secciones se muestran y cuales rutas internas estan permitidas.

## Servicios

`src/services/api.ts`

- contiene `apiRequest`
- usa rutas relativas (`BASE_URL = ""`)
- agrega `Content-Type: application/json`
- agrega `Authorization: Bearer <token>` si existe token
- guarda y limpia `auth_token`
- guarda y limpia `auth_role`
- limpia la sesion si la API responde `401`
- expone `ApiError` con `status`

`src/services/auth.ts`

- define roles del backend:
  - `ADMIN = 1`
  - `CONDUCTOR = 2`
  - `SUPERVISOR = 3`
  - `COORDINADOR = 4`
- define permisos por seccion
- expone `canAccess`, `roleName` y `firstAccessibleAdminPath`

## Rutas internas

Archivo:

```txt
src/Router/AppRouter.tsx
```

Rutas principales:

```txt
/login
/dashboard
/historial
/alertas
/anomalias
/estado-ruta
/validacion-recoleccion
/administracion/rellenos
/administracion/camiones
/administracion/dias-recoleccion
/administracion/empleados
```

Proteccion:

```txt
src/Router/Guards.tsx
```

- `RequireAuth`: exige token.
- `RequireRole`: exige token y rol permitido para la seccion.

Si no hay token, redirige a `/login`. Si hay token pero el rol no tiene permiso, redirige a `/dashboard`.

## Endpoints usados

El proyecto centraliza las llamadas mediante `apiRequest`. Algunos endpoints usados:

```txt
POST /api/empleados/login
GET  /api/rutas/
GET  /api/puntos-recoleccion/
POST /api/puntos-recoleccion/
PUT  /api/puntos-recoleccion/:id
DELETE /api/puntos-recoleccion/:id
GET  /api/anomalias/
POST /api/anomalias/
PUT  /api/anomalias/:id
GET  /api/relleno-sanitario/
POST /api/relleno-sanitario/
PUT  /api/relleno-sanitario/:id
DELETE /api/relleno-sanitario/:id
GET  /api/camion/
POST /api/camion/
PUT  /api/camion/:id
DELETE /api/camion/:id
GET  /api/tipo-camion/
GET  /api/empleados/
POST /api/empleados/
DELETE /api/empleados/:id
```

## Roles y permisos visibles

Los permisos del frontend estan en `src/services/auth.ts` y reflejan los roles del backend:

- `Dashboard` e `Historial`: cualquier usuario autenticado.
- `Anomalias`: ADMIN, SUPERVISOR, COORDINADOR.
- `Alertas`: ADMIN, SUPERVISOR, COORDINADOR.
- `Puntos de Ruta`: CONDUCTOR, SUPERVISOR, COORDINADOR.
- `Validacion de Recoleccion`: ADMIN, SUPERVISOR, COORDINADOR.
- `Administracion/Rellenos`: CONDUCTOR, SUPERVISOR, COORDINADOR.
- `Administracion/Camiones`: CONDUCTOR, SUPERVISOR, COORDINADOR.
- `Administracion/Dias de Recoleccion`: ADMIN, SUPERVISOR, COORDINADOR.
- `Administracion/Empleados`: ADMIN.

## Navbar y cierre de sesion

Archivo:

```txt
src/components/Navigation/Navbar.tsx
```

El navbar:

- muestra solo secciones permitidas para el rol guardado
- muestra el nombre del rol
- permite cerrar sesion
- al cerrar sesion limpia `auth_token` y `auth_role`

## Notas sobre CORS y ngrok

Para desarrollo local, evita poner la URL de ngrok en `VITE_API_URL`, porque el navegador llamaria directo a otro origen y puede aparecer:

```txt
Access-Control-Allow-Origin missing
Failed to fetch
```

Usa mejor:

```env
ALLOW_ALL_HOSTS=true
ALLOWED_HOSTS=
VITE_API_URL=
API_PROXY_TARGET=https://TU-SUBDOMINIO.ngrok-free.app
```

Asi el navegador llama a `/api/...` en el mismo origen de Vite, y Vite reenvia la peticion al backend.

## Archivos importantes

- `vite.config.mjs`: configuracion real usada por scripts.
- `.env.example`: ejemplo documentado para desarrollo y produccion.
- `.env.development`: variables de desarrollo y pruebas.
- `src/services/api.ts`: cliente HTTP, token y rol.
- `src/services/auth.ts`: roles y permisos.
- `src/Router/AppRouter.tsx`: rutas internas.
- `src/Router/Guards.tsx`: proteccion por token y rol.
- `src/Pages/Login/Login.tsx`: login.
