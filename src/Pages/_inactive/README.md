# Páginas sin conectar

Estas pantallas están completas en el frontend (UI, estado, interacciones) pero
hoy **no tienen ningún enlace de navegación** (no aparecen en el Navbar ni en
el sidebar de Administración) **y no llaman a ningún endpoint del backend**
(trabajan con datos mock en estado local). Se movieron aquí para que no estén
mezcladas con las páginas activas, sin borrar el trabajo ya hecho por si se
retoman más adelante.

Sus rutas siguen registradas en `src/Router/AppRouter.tsx` (son accesibles
por URL directa si un usuario con el rol adecuado navega ahí a mano), solo que
ningún componente de navegación enlaza a ellas.

## Contenido

### `Alertas/`
- Ruta: `/alertas` (guardada con `RequireRole section="alertas"`).
- Estado: sin conectar a backend, datos 100% mock (`Alertas.tsx`).
- Por qué está oculta: decisión de producto (ver comentario original en
  `Navbar.tsx`), no un bug.
- Para reactivarla: agregar el item de vuelta a `allNavItems` en
  `src/components/Navigation/Navbar.tsx` y reemplazar el mock por llamadas
  reales a `apiRequest`. El backend ya tiene módulos relacionados
  (`gin-backend/src/Mantenimiento` para alertas de mantenimiento de camiones,
  `gin-backend/src/alerta_usuario` para alertas de usuario) que podrían servir
  de base, pero ninguno coincide 1:1 con el modelo de datos actual de esta
  pantalla (`TipoAlerta`/`EstadoAlerta` en `Alertas.tsx`) — revisar antes de
  wirearla.

### `ValidacionRecoleccion/`
- Ruta: `/validacion-recoleccion` (guardada con
  `RequireRole section="validacionRecoleccion"`).
- Estado: sin conectar a backend, datos 100% mock.
- Por qué está oculta: pendiente de implementar (ver comentario original en
  `Navbar.tsx`).
- Para reactivarla: agregar el item de vuelta a `allNavItems` en
  `Navbar.tsx` y conectar a un endpoint real (no se encontró ningún módulo
  backend equivalente todavía; habría que crearlo).

### `DiasRecoleccion/`
- Ruta: `/administracion/dias-recoleccion` (sub-sección de Administración,
  guardada con `RequireRole section="administracionDiasRecoleccion"`).
- Estado: sin conectar a backend, datos 100% mock
  (`DiasRecoleccionPage.tsx` + `components/ConfigTable.tsx` +
  `components/DiasSelector.tsx`).
- Por qué está oculta: pendiente de implementar (ver comentario original en
  `SidebarAdministracion.tsx`); tampoco está en la lista de redirección
  `ADMINISTRACION_SUBSECCIONES` de `src/services/auth.ts`.
- Para reactivarla: agregar el ícono/link de vuelta en
  `SidebarAdministracion.tsx`, sumarla a `ADMINISTRACION_SUBSECCIONES` en
  `auth.ts`, y crear el endpoint/tabla en el backend (no existe hoy — ni la
  tabla en `db_script.sql` ni rutas en `gin-backend/src`).

## Cómo reactivar cualquiera de estas páginas

1. Mover la carpeta de vuelta a `src/Pages/` (o a `src/Pages/Administracion/`
   para Días de Recolección) con `git mv` para conservar el historial.
2. Actualizar el import correspondiente en `src/Router/AppRouter.tsx`.
3. Agregar el enlace de navegación (Navbar o SidebarAdministracion, según
   corresponda).
4. Reemplazar los datos mock por llamadas reales a `apiRequest`, verificando
   primero que exista (o creando) el endpoint backend correspondiente.

No fue necesario tocar nada del código activo del frontend para hacer este
movimiento: estas tres páginas eran autocontenidas (solo importaban su propio
CSS/componentes internos), así que la mudanza fue un simple `git mv` +
actualizar 2 imports en `AppRouter.tsx`.
