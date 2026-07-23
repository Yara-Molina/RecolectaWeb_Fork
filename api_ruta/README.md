# api_ruta

API dedicada para guardar las rutas dibujadas desde el Dashboard web. Corre en el puerto 8004 y guarda los datos en `rutas.json` (base de datos simple en archivo, pensada para desarrollo).

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Queda escuchando en `http://localhost:8004`.

## Swagger

Documentación interactiva disponible en `http://localhost:8004/api/docs`.

## Usuarios y login

Al arrancar por primera vez se crea automáticamente un usuario administrador:

- email: `admin@recolecta.mx`
- password: `admin1234` (o el valor de `ADMIN_DEFAULT_PASSWORD` si lo defines antes de arrancar)

Los datos quedan en `usuarios.json` (contraseñas guardadas con hash bcrypt, nunca en texto plano).

### POST /api/empleados/login
Body:
```json
{ "email": "admin@recolecta.mx", "password": "admin1234" }
```

Respuesta (200):
```json
{
  "success": true,
  "token": "<jwt>",
  "data": { "usuario_id": 1, "nombre": "Administrador", "email": "admin@recolecta.mx", "rol_id": 1, "created_at": "..." }
}
```

El resto de endpoints de usuarios y rutas que crean/borran datos requieren el header `Authorization: Bearer <token>`.

### GET /api/usuarios
Lista usuarios (requiere token).

### POST /api/usuarios
Crea un usuario nuevo (requiere token).
```json
{ "nombre": "Juan Pérez", "email": "juan@recolecta.mx", "password": "contrasena123", "rol_id": 2 }
```

### DELETE /api/usuarios/:id
Elimina un usuario (requiere token).

## Endpoints de rutas

### POST /api/rutas
Crea una ruta nueva.

Body:
```json
{
  "nombre": "Ruta Norte",
  "descripcion": "Ruta creada desde el dashboard",
  "puntos": [
    { "lat": 16.6205, "lng": -93.1042, "direccion": "Calle X, Suchiapa" },
    { "lat": 16.6198, "lng": -93.1015, "direccion": "Calle Y, Suchiapa" }
  ]
}
```

Respuesta (201):
```json
{
  "success": true,
  "data": {
    "ruta_id": 1,
    "nombre": "Ruta Norte",
    "descripcion": "Ruta creada desde el dashboard",
    "json_ruta": "[{\"lat\":16.6205,\"lng\":-93.1042,\"direccion\":\"Calle X, Suchiapa\"}, ...]",
    "created_at": "2026-07-21T12:00:00.000Z"
  }
}
```

El campo `json_ruta` es el string JSON que consumirá la app móvil para trazar/optimizar la ruta.

### GET /api/rutas
Lista todas las rutas guardadas.

### GET /api/rutas/:id
Obtiene una ruta por su `ruta_id`.

### DELETE /api/rutas/:id
Elimina una ruta.
