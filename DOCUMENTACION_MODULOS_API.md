# Recolecta Web - Inventario de modulos y pendientes de API

Fecha de revision: 2026-06-25

Este documento resume los modulos existentes en el frontend para que otra IA o el equipo de backend pueda identificar que pantallas faltan por conectar con la API.

## Estado general

- Proyecto: React 19 + TypeScript + Vite.
- Router principal: `src/Router/AppRouter.tsx`.
- No se encontraron llamadas reales a API (`fetch`, `axios` o cliente HTTP propio).
- No existe carpeta de servicios/API centralizada.
- La informacion se maneja principalmente con arreglos mock y `useState`.
- No hay guardas de autenticacion ni manejo de token.
- La dependencia `@googlemaps/js-api-loader` existe, pero no hay implementacion de Google Maps.

## Rutas existentes

| Ruta | Modulo | Archivo | Estado API |
| --- | --- | --- | --- |
| `/login` | Login | `src/Pages/Login/Login.tsx` | Pendiente |
| `/dashboard` | Dashboard | `src/Pages/Dashboard/Dashboard.tsx` | Pendiente |
| `/historial` | Historial | `src/Pages/Historial/Historial.tsx` | Pendiente |
| `/alertas` | Alertas | `src/Pages/Alertas/Alertas.tsx` | Pendiente |
| `/anomalias` | Anomalias | `src/Pages/Anomalias/Anomalias.tsx` | Pendiente |
| `/estado-ruta` | Puntos de Ruta | `src/Pages/EstadoRuta/EstadoRuta.tsx` | Pendiente |
| `/validacion-recoleccion` | Validacion de Recoleccion | `src/Pages/ValidacionRecoleccion/ValidacionRecoleccion.tsx` | Pendiente |
| `/administracion/rellenos` | Rellenos Sanitarios | `src/Pages/Administracion/RellenosSanitarios/RellenosSanitariosPage.tsx` | Pendiente |
| `/administracion/camiones` | Camiones | `src/Pages/Administracion/Camiones/CamionesPage.tsx` | Pendiente |
| `/administracion/dias-recoleccion` | Dias de Recoleccion | `src/Pages/Administracion/DiasRecoleccion/DiasRecoleccionPage.tsx` | Pendiente |

## Ruta visible pero no implementada

| Ruta | Referencia | Situacion |
| --- | --- | --- |
| `/mapa` | `src/components/Navigation/Navbar.tsx` | Aparece en el navbar, pero no existe route en `AppRouter.tsx` ni pagina en `src/Pages/Mapa`. Actualmente caeria al redirect 404 hacia `/login`. |

## Modulo: Login

Archivo: `src/Pages/Login/Login.tsx`

Funcion actual:
- Captura `nombre` y `contrasena`.
- Al enviar, solo imprime en consola y navega a `/dashboard`.

Datos actuales:
- `nombre`
- `contrasena`

Pendiente de API:
- Conectar endpoint de autenticacion.
- Guardar token/sesion si aplica.
- Manejar errores de credenciales.
- Evitar navegar al dashboard sin autenticacion valida.
- Definir roles/permisos si la API los maneja.

Endpoints esperados:
- `POST /auth/login`
- Opcional: `GET /auth/me`
- Opcional: `POST /auth/logout`

## Modulo: Dashboard

Archivo: `src/Pages/Dashboard/Dashboard.tsx`

Funcion actual:
- Muestra monitoreo de flota.
- Muestra mini mapa SVG con camiones animados.
- Muestra metricas, alertas activas, incidencias y progreso por ruta.

Datos mock actuales:
- `RUTAS_INICIALES`: id, nombre, conductor, estado, progreso, color, badge.
- `ALERTAS`: id, titulo, detalle, tipo, tiempo.
- `INCIDENCIAS`: id, fecha, hora, descripcion, ubicacion.
- `MAP_PATHS`: coordenadas SVG internas para pintar rutas.

Pendiente de API:
- Obtener resumen de flota/rutas en tiempo real.
- Obtener posiciones reales de camiones o progreso por ruta.
- Obtener alertas activas.
- Obtener incidencias recientes.
- Reemplazar mapa SVG por datos geograficos reales si la API entrega coordenadas.

Endpoints esperados:
- `GET /dashboard/resumen`
- `GET /rutas/estado-actual`
- `GET /camiones/posiciones`
- `GET /alertas?estado=activas`
- `GET /incidencias?limit=...`

## Modulo: Historial

Archivo: `src/Pages/Historial/Historial.tsx`

Funcion actual:
- Lista historial de recolecciones.
- Filtra por fecha, ruta, conductor, estado y texto.
- Muestra paginacion visual, pero sin logica real de paginado.

Datos mock actuales:
- id
- punto
- direccion
- fecha
- hora
- conductor
- vehiculo
- ruta
- estado: `completado`, `en-proceso`, `retrasado`, `pendiente`

Pendiente de API:
- Listar historial con filtros desde backend.
- Paginacion real.
- Detalle de recoleccion al usar boton "Ver".
- Exportacion si se requiere.

Endpoints esperados:
- `GET /recolecciones/historial`
- `GET /recolecciones/{id}`
- Opcional: `GET /recolecciones/historial/export`

## Modulo: Alertas

Archivo: `src/Pages/Alertas/Alertas.tsx`

Funcion actual:
- Lista alertas.
- Filtra por estado y texto.
- Permite crear, editar y eliminar alertas solo en estado local.
- Permite agregar puntos afectados dentro del formulario.

Datos actuales:
- id
- tipo: `mecanica`, `acceso`, `clima`, `personal`, `capacidad`, `trafico`, `otro`
- detalles
- puntosAfectados: string[]
- ruta
- vehiculo
- estado: `pendiente`, `en-proceso`, `resuelto`, `cancelado`
- fechaCreacion
- conductor
- prioridad: `baja`, `media`, `alta`, `critica`

Pendiente de API:
- Listar alertas.
- Crear alerta.
- Actualizar alerta.
- Eliminar/cancelar alerta.
- Cargar rutas, vehiculos y puntos afectados desde catalogos reales.
- Ordenar por prioridad actualmente solo es boton visual.

Endpoints esperados:
- `GET /alertas`
- `POST /alertas`
- `PUT /alertas/{id}`
- `DELETE /alertas/{id}` o `PATCH /alertas/{id}/cancelar`
- `GET /rutas`
- `GET /camiones`
- `GET /puntos-recoleccion`

## Modulo: Anomalias

Archivo: `src/Pages/Anomalias/Anomalias.tsx`

Funcion actual:
- Lista anomalias reportadas.
- Filtra por estado, prioridad y busqueda.
- Muestra modal de detalle.
- El modal tiene controles para actualizar estado, asignar equipo, comentar y guardar, pero no persisten cambios.

Datos mock actuales:
- id
- punto
- nombre
- direccion
- descripcion
- tipo: `infraestructura`, `contaminacion`, `acceso`, `capacidad`, `sanitario`, `vandalismo`, `abastecimiento`, `fuga`
- fecha
- hora
- estado: `completado`, `en-proceso`, `retrasado`, `pendiente`
- prioridad: `critica`, `media`, `baja`
- reportadoPor
- asignadoA
- kilosAfetados
- tiempoResolucion

Nota:
- El campo esta escrito como `kilosAfetados`; conviene confirmar si debe ser `kilosAfectados`.

Pendiente de API:
- Listar anomalias con filtros.
- Obtener detalle completo.
- Actualizar estado.
- Asignar equipo/responsable.
- Agregar comentarios.
- Consultar historial de acciones real.
- Exportar reporte.

Endpoints esperados:
- `GET /anomalias`
- `GET /anomalias/{id}`
- `PATCH /anomalias/{id}/estado`
- `PATCH /anomalias/{id}/asignacion`
- `POST /anomalias/{id}/comentarios`
- `GET /anomalias/{id}/historial`
- Opcional: `GET /anomalias/export`

## Modulo: Puntos de Ruta

Archivo: `src/Pages/EstadoRuta/EstadoRuta.tsx`

Funcion actual:
- Administra puntos de ruta.
- Permite crear, editar y eliminar puntos solo en estado local.
- Filtra por texto.
- Selector de ruta existe, pero no filtra datos reales por ruta.

Datos actuales:
- id
- latitud
- longitud
- direccion
- estado: `activo`, `inactivo`, `pendiente`
- puntoRecoleccionId
- puntoRecoleccionNombre

Catalogos mock:
- `puntosRecoleccion`: id, nombre, direccion.
- `rutasDisponibles`: `Ruta 01` a `Ruta 05`.

Pendiente de API:
- Listar rutas disponibles.
- Listar puntos de ruta por ruta.
- Crear punto de ruta.
- Actualizar punto de ruta.
- Eliminar punto de ruta.
- Cargar catalogo de puntos de recoleccion.
- Implementar filtros rapidos por estado, actualmente son visuales.
- Implementar exportacion.

Endpoints esperados:
- `GET /rutas`
- `GET /rutas/{id}/puntos`
- `POST /rutas/{id}/puntos`
- `PUT /puntos-ruta/{id}`
- `DELETE /puntos-ruta/{id}`
- `GET /puntos-recoleccion`

## Modulo: Validacion de Recoleccion

Archivo: `src/Pages/ValidacionRecoleccion/ValidacionRecoleccion.tsx`

Funcion actual:
- Lista registros de recoleccion.
- Filtra por estado y texto.
- Muestra modal de validacion.
- Botones de aprobar/rechazar/enviar a revision no persisten cambios.

Datos mock actuales:
- id
- punto
- nombre
- direccion
- fecha
- hora
- valido: `---`, `Pendiente`, `Validado`, `Rechazado`
- estado: `completado`, `en-proceso`, `retrasado`, `pendiente`
- conductor
- vehiculo
- notas

Pendiente de API:
- Listar registros pendientes/completados.
- Obtener detalle de registro.
- Aprobar recoleccion.
- Rechazar recoleccion con comentario.
- Enviar a revision.
- Guardar comentarios del supervisor.
- Cargar evidencias si la API las maneja (fotos, ubicacion, firma, peso, etc.).

Endpoints esperados:
- `GET /validaciones-recoleccion`
- `GET /validaciones-recoleccion/{id}`
- `POST /validaciones-recoleccion/{id}/aprobar`
- `POST /validaciones-recoleccion/{id}/rechazar`
- `POST /validaciones-recoleccion/{id}/revision`
- `POST /validaciones-recoleccion/{id}/comentarios`

## Modulo: Administracion - Rellenos Sanitarios

Archivos:
- `src/Pages/Administracion/RellenosSanitarios/RellenosSanitariosPage.tsx`
- `src/Pages/Administracion/RellenosSanitarios/components/RellenoForm.tsx`
- `src/Pages/Administracion/RellenosSanitarios/components/RellenosTable.tsx`
- Tipo duplicado en `src/modules/RellenoSanitario.ts`

Funcion actual:
- Lista rellenos sanitarios.
- Filtra por texto y estado.
- Permite crear, editar y eliminar en estado local.
- Exporta CSV desde los datos locales filtrados.
- Boton "Detalles" muestra un `alert`.

Datos actuales:
- id
- nombre
- direccion
- municipio
- capacidadToneladas
- estado: `Activo`, `Inactivo`
- fechaRegistro

Pendiente de API:
- Listar rellenos.
- Crear relleno.
- Actualizar relleno.
- Eliminar o desactivar relleno.
- Obtener detalle.
- Exportar desde backend si se requiere consistencia con permisos/filtros.
- Evitar duplicacion de tipos entre pagina y `src/modules`.

Endpoints esperados:
- `GET /rellenos-sanitarios`
- `GET /rellenos-sanitarios/{id}`
- `POST /rellenos-sanitarios`
- `PUT /rellenos-sanitarios/{id}`
- `DELETE /rellenos-sanitarios/{id}` o `PATCH /rellenos-sanitarios/{id}/estado`
- Opcional: `GET /rellenos-sanitarios/export`

## Modulo: Administracion - Camiones

Archivos:
- `src/Pages/Administracion/Camiones/CamionesPage.tsx`
- `src/Pages/Administracion/Camiones/components/CamionForm.tsx`
- `src/Pages/Administracion/Camiones/components/CamionesTable.tsx`

Funcion actual:
- Lista camiones.
- Filtra por disponibilidad, rentado y texto.
- Permite crear, editar y eliminar logicamente en estado local.
- Exporta CSV desde datos locales.
- Boton "Detalles" no tiene accion conectada.

Datos actuales:
- camion_id
- placa
- modelo
- tipo_camion_id
- es_rentado
- disponibilidad: `DISPONIBLE`, `EN_RUTA`, `MANTENIMIENTO`, `FUERA_SERVICIO`
- eliminado
- created_at
- updated_at
- tipo_camion: tipo_camion_id, nombre

Catalogo mock:
- Tipos de camion: Compactador, Volteo, Recoleccion Ligera.

Pendiente de API:
- Listar camiones.
- Cargar tipos de camion.
- Crear camion.
- Actualizar camion.
- Eliminar/desactivar camion.
- Obtener detalle.
- Exportar desde backend si aplica.

Endpoints esperados:
- `GET /camiones`
- `GET /camiones/{id}`
- `POST /camiones`
- `PUT /camiones/{id}`
- `DELETE /camiones/{id}` o `PATCH /camiones/{id}/eliminar`
- `GET /tipos-camion`
- Opcional: `GET /camiones/export`

## Modulo: Administracion - Dias de Recoleccion

Archivos:
- `src/Pages/Administracion/DiasRecoleccion/DiasRecoleccionPage.tsx`
- `src/Pages/Administracion/DiasRecoleccion/components/DiasSelector.tsx`
- `src/Pages/Administracion/DiasRecoleccion/components/ConfigTable.tsx`
- Tipo duplicado en `src/modules/DiadeRecoleccion.ts`

Funcion actual:
- Lista configuraciones de dias de recoleccion.
- Filtra por texto y estado.
- Permite crear, editar y eliminar en estado local.

Datos actuales:
- id
- ruta
- colonia
- dias: string[]
- turno: `Matutino`, `Vespertino`
- estado: `Activo`, `Inactivo`
- fechaRegistro

Pendiente de API:
- Listar configuraciones.
- Crear configuracion.
- Actualizar configuracion.
- Eliminar/desactivar configuracion.
- Cargar rutas y colonias desde catalogos reales si existen.
- Evitar duplicacion de tipos entre pagina y `src/modules`.

Endpoints esperados:
- `GET /dias-recoleccion`
- `GET /dias-recoleccion/{id}`
- `POST /dias-recoleccion`
- `PUT /dias-recoleccion/{id}`
- `DELETE /dias-recoleccion/{id}` o `PATCH /dias-recoleccion/{id}/estado`
- `GET /rutas`
- Opcional: `GET /colonias`

## Componentes de navegacion y layout

### Navbar

Archivo: `src/components/Navigation/Navbar.tsx`

Funcion actual:
- Navegacion principal.
- Incluye links a dashboard, mapa, historial, alertas, anomalias, puntos de ruta, recoleccion y administracion.

Pendiente:
- Corregir o implementar `/mapa`.
- Mostrar usuario real desde sesion.
- Agregar logout si la API de autenticacion lo requiere.
- Ocultar/mostrar modulos por rol si aplica.

### AdministracionLayout y SidebarAdministracion

Archivos:
- `src/Pages/Administracion/AdministracionLayout.tsx`
- `src/Pages/Administracion/SidebarAdministracion.tsx`

Funcion actual:
- Layout anidado para administracion.
- Sidebar con iconos hacia rellenos, camiones y dias de recoleccion.

Pendiente:
- Sin conexion API directa.
- Puede requerir control de permisos por rol.

## Prioridad sugerida de conexion con API

1. Login y sesion: necesario para proteger el sistema.
2. Catalogos base: rutas, camiones, tipos de camion, puntos de recoleccion, rellenos, colonias.
3. Administracion: camiones, rellenos sanitarios, dias de recoleccion.
4. Operacion diaria: puntos de ruta, validacion de recoleccion, alertas, anomalias.
5. Dashboard e historial: dependen de datos operativos ya conectados.
6. Mapa: definir si sera pagina independiente `/mapa` o parte del dashboard.

## Recomendacion tecnica para integrar API

Crear una capa central antes de modificar pantallas:

- `src/services/apiClient.ts`: cliente HTTP con base URL, headers y token.
- `src/services/authService.ts`
- `src/services/camionesService.ts`
- `src/services/rellenosService.ts`
- `src/services/diasRecoleccionService.ts`
- `src/services/rutasService.ts`
- `src/services/alertasService.ts`
- `src/services/anomaliasService.ts`
- `src/services/validacionService.ts`
- `src/services/historialService.ts`

Variables de entorno sugeridas:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Patron recomendado por pantalla:

- Cargar datos con `useEffect`.
- Mostrar estados `loading`, `error` y `empty`.
- Mantener filtros locales solo cuando el dataset sea pequeno; usar filtros de API para listas grandes.
- Reemplazar los `alert`/`confirm` nativos si luego se agrega un sistema de modales/toasts.
- Normalizar nombres de campos entre frontend y API.

## Observaciones importantes

- Hay imports con `../../Assets/Logo.png`, pero la carpeta real listada es `src/assets`. En Windows puede funcionar por case-insensitive, pero en despliegues Linux puede fallar. Conviene cambiar a `../../assets/Logo.png`.
- Existen caracteres mal codificados visibles en varios textos (`CamiÃ³n`, `DÃ­as`, etc.). Antes de hacer cambios masivos, conviene normalizar codificacion a UTF-8.
- Algunos botones son visuales y no hacen operaciones reales: detalles en camiones, ordenar por prioridad, exportar en algunos modulos, aprobar/rechazar validacion, guardar anomalia.
- No hay pruebas automatizadas.
- No hay manejo global de errores ni autenticacion.

