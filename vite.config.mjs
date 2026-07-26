import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isServing = command === "serve";
  const allowAllHosts = env.ALLOW_ALL_HOSTS === "true";
  const configuredHosts = (env.ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
  const allowedHosts = allowAllHosts ? true : configuredHosts;
  const proxyTarget =
    env.API_PROXY_TARGET ||
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_URL ||
    "http://localhost:8081";
  // map-view corre como su propio proyecto Vite (npm run dev dentro de
  // map-view/); en produccion nginx lo sirve en /mapa (ver
  // docker/nginx/nginx.prod.conf), pero en dev no hay nginx, asi que sin
  // este proxy /mapa/ cae en el fallback SPA de este frontend y termina en
  // el comodin "*" -> /login de AppRouter.tsx.
  // NOTA PRODUCCION: este bloque (server.proxy / preview.proxy) no se usa
  // en "vite build" ni en el sitio ya desplegado -- ahi el que decide como
  // se sirve /mapa/ es nginx.prod.conf, no este archivo. No hace falta
  // tocar ni quitar nada de aqui al pasar a produccion; solo hay que
  // reconstruir y redeployar el stack de docker para que el build nuevo
  // (con el link "Mapa" del Navbar) llegue al contenedor de nginx.
  const mapviewProxyTarget =
    env.MAPVIEW_PROXY_TARGET ||
    env.VITE_MAPVIEW_PROXY_TARGET ||
    "http://localhost:5174";

  const rutasApiTarget = env.API_RUTA_URL || "http://localhost:8004";

  if (isServing && mode === "production" && allowAllHosts) {
    throw new Error("ALLOW_ALL_HOSTS no puede estar habilitado en produccion.");
  }

  if (
    isServing &&
    mode === "production" &&
    !allowAllHosts &&
    configuredHosts.length === 0
  ) {
    throw new Error(
      "ALLOWED_HOSTS debe contener al menos un host en produccion.",
    );
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      allowedHosts,
      proxy: {
        "/rutas": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/puntos-recoleccion": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/optimizar": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "1");
            });
          },
        },
        "/mapa": {
          target: mapviewProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      host: "0.0.0.0",
      allowedHosts,
      proxy: {
        "/rutas": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/puntos-recoleccion": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/optimizar": {
          target: rutasApiTarget,
          changeOrigin: true,
        },
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "1");
            });
          },
        },
        "/mapa": {
          target: mapviewProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});