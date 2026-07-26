[1mdiff --git a/.env.development b/.env.development[m
[1mindex 6f5c2cb..88920a7 100644[m
[1m--- a/.env.development[m
[1m+++ b/.env.development[m
[36m@@ -5,7 +5,7 @@[m [mALLOW_ALL_HOSTS=true[m
 ALLOWED_HOSTS=[m
 [m
 # Ajustar al destino real del backend[m
[31m-API_PROXY_TARGET=https://shameably-unfathomable-candice.ngrok-free.dev/[m
[32m+[m[32mAPI_PROXY_TARGET=https://shameably-unfathomable-candice.ngrok-free.dev[m
 [m
 VITE_API_URL=[m
 VITE_API_PROXY_TARGET=[m
[1mdiff --git a/package-lock.json b/package-lock.json[m
[1mindex b3110e8..7a2661d 100644[m
[1m--- a/package-lock.json[m
[1m+++ b/package-lock.json[m
[36m@@ -9,13 +9,16 @@[m
       "version": "0.0.0",[m
       "dependencies": {[m
         "@googlemaps/js-api-loader": "^2.0.2",[m
[32m+[m[32m        "leaflet": "^1.9.4",[m
         "react": "^19.2.0",[m
         "react-dom": "^19.2.0",[m
         "react-icons": "^5.5.0",[m
[32m+[m[32m        "react-leaflet": "^5.0.0",[m
         "react-router-dom": "^7.12.0"[m
       },[m
       "devDependencies": {[m
         "@eslint/js": "^9.39.1",[m
[32m+[m[32m        "@types/leaflet": "^1.9.21",[m
         "@types/node": "^24.10.1",[m
         "@types/react": "^19.2.5",[m
         "@types/react-dom": "^19.2.3",[m
[36m@@ -1022,6 +1025,17 @@[m
         "@jridgewell/sourcemap-codec": "^1.4.14"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/@react-leaflet/core": {[m
[32m+[m[32m      "version": "3.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@react-leaflet/core/-/core-3.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-3EWmekh4Nz+pGcr+xjf0KNyYfC3U2JjnkWsh0zcqaexYqmmB5ZhH37kz41JXGmKzpaMZCnPofBBm64i+YrEvGQ==",[m
[32m+[m[32m      "license": "Hippocratic-2.1",[m
[32m+[m[32m      "peerDependencies": {[m
[32m+[m[32m        "leaflet": "^1.9.0",[m
[32m+[m[32m        "react": "^19.0.0",[m
[32m+[m[32m        "react-dom": "^19.0.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@rolldown/pluginutils": {[m
       "version": "1.0.0-beta.47",[m
       "resolved": "https://registry.npmjs.org/@rolldown/pluginutils/-/pluginutils-1.0.0-beta.47.tgz",[m
[36m@@ -1389,6 +1403,13 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/@types/geojson": {[m
[32m+[m[32m      "version": "7946.0.16",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/geojson/-/geojson-7946.0.16.tgz",[m
[32m+[m[32m      "integrity": "sha512-6C8nqWur3j98U6+lXDfTUWIfgvZU+EumvpHKcYjujKH7woYyLj2sUmff0tRhrqM7BohUw7Pz3ZB1jj2gW9Fvmg==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT"[m
[32m+[m[32m    },[m
     "node_modules/@types/google.maps": {[m
       "version": "3.58.1",[m
       "resolved": "https://registry.npmjs.org/@types/google.maps/-/google.maps-3.58.1.tgz",[m
[36m@@ -1409,6 +1430,16 @@[m
       "dev": true,[m
       "license": "MIT"[m
     },[m
[32m+[m[32m    "node_modules/@types/leaflet": {[m
[32m+[m[32m      "version": "1.9.21",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/@types/leaflet/-/leaflet-1.9.21.tgz",[m
[32m+[m[32m      "integrity": "sha512-TbAd9DaPGSnzp6QvtYngntMZgcRk+igFELwR2N99XZn7RXUdKgsXMR+28bUO0rPsWp8MIu/f47luLIQuSLYv/w==",[m
[32m+[m[32m      "dev": true,[m
[32m+[m[32m      "license": "MIT",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@types/geojson": "*"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/@types/node": {[m
       "version": "24.10.1",[m
       "resolved": "https://registry.npmjs.org/@types/node/-/node-24.10.1.tgz",[m
[36m@@ -2595,6 +2626,12 @@[m
         "json-buffer": "3.0.1"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/leaflet": {[m
[32m+[m[32m      "version": "1.9.4",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/leaflet/-/leaflet-1.9.4.tgz",[m
[32m+[m[32m      "integrity": "sha512-nxS1ynzJOmOlHp+iL3FyWqK89GtNL8U8rvlMOsQdTTssxZwCXh8N2NB3GDQOL+YR3XnWyZAxwQixURb+FA74PA==",[m
[32m+[m[32m      "license": "BSD-2-Clause"[m
[32m+[m[32m    },[m
     "node_modules/levn": {[m
       "version": "0.4.1",[m
       "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",[m
[36m@@ -2877,6 +2914,20 @@[m
         "react": "*"[m
       }[m
     },[m
[32m+[m[32m    "node_modules/react-leaflet": {[m
[32m+[m[32m      "version": "5.0.0",[m
[32m+[m[32m      "resolved": "https://registry.npmjs.org/react-leaflet/-/react-leaflet-5.0.0.tgz",[m
[32m+[m[32m      "integrity": "sha512-CWbTpr5vcHw5bt9i4zSlPEVQdTVcML390TjeDG0cK59z1ylexpqC6M1PJFjV8jD7CF+ACBFsLIDs6DRMoLEofw==",[m
[32m+[m[32m      "license": "Hippocratic-2.1",[m
[32m+[m[32m      "dependencies": {[m
[32m+[m[32m        "@react-leaflet/core": "^3.0.0"[m
[32m+[m[32m      },[m
[32m+[m[32m      "peerDependencies": {[m
[32m+[m[32m        "leaflet": "^1.9.0",[m
[32m+[m[32m        "react": "^19.0.0",[m
[32m+[m[32m        "react-dom": "^19.0.0"[m
[32m+[m[32m      }[m
[32m+[m[32m    },[m
     "node_modules/react-refresh": {[m
       "version": "0.18.0",[m
       "resolved": "https://registry.npmjs.org/react-refresh/-/react-refresh-0.18.0.tgz",[m
[1mdiff --git a/package.json b/package.json[m
[1mindex e5a1287..d27379f 100644[m
[1m--- a/package.json[m
[1m+++ b/package.json[m
[36m@@ -11,13 +11,16 @@[m
   },[m
   "dependencies": {[m
     "@googlemaps/js-api-loader": "^2.0.2",[m
[32m+[m[32m    "leaflet": "^1.9.4",[m
     "react": "^19.2.0",[m
     "react-dom": "^19.2.0",[m
     "react-icons": "^5.5.0",[m
[32m+[m[32m    "react-leaflet": "^5.0.0",[m
     "react-router-dom": "^7.12.0"[m
   },[m
   "devDependencies": {[m
     "@eslint/js": "^9.39.1",[m
[32m+[m[32m    "@types/leaflet": "^1.9.21",[m
     "@types/node": "^24.10.1",[m
     "@types/react": "^19.2.5",[m
     "@types/react-dom": "^19.2.3",[m
[1mdiff --git a/src/Pages/Dashboard/Dashboard.css b/src/Pages/Dashboard/Dashboard.css[m
[1mindex b68021b..c8b3c49 100644[m
[1m--- a/src/Pages/Dashboard/Dashboard.css[m
[1m+++ b/src/Pages/Dashboard/Dashboard.css[m
[36m@@ -225,6 +225,10 @@[m
   background: transparent;[m
 }[m
 [m
[32m+[m[32m.card-title--flex {[m
[32m+[m[32m  justify-content: space-between;[m
[32m+[m[32m}[m
[32m+[m
 .ruta-filter-select {[m
   padding: 6px 12px;[m
   border: 1px solid rgba(15, 103, 108, 0.25);[m
[36m@@ -247,42 +251,68 @@[m
   opacity: 0.8;[m
 }[m
 [m
[31m-/* ===== MAPA - VERSIÓN COMPACTA ===== */[m
[32m+[m[32m/* ===== MAPA ===== */[m
 .mapa-wrap {[m
   padding: 16px;[m
   background: rgba(255, 255, 255, 0.6);[m
[32m+[m[32m  height: 320px;[m
[32m+[m[32m  border-radius: 10px;[m
 }[m
 [m
[31m-.mapa-svg {[m
[32m+[m[32m.mapa-wrap .leaflet-container {[m
[32m+[m[32m  height: 100%;[m
   width: 100%;[m
[31m-  height: auto;[m
[31m-  max-height: 260px;[m
[31m-  background: #eef2ef;[m
   border-radius: 10px;[m
[31m-  margin-bottom: 16px;[m
   box-shadow: inset 0 0 0 1px rgba(15, 103, 108, 0.1);[m
 }[m
 [m
[31m-.mapa-legend {[m
[32m+[m[32m.card--mapa-expandido {[m
[32m+[m[32m  position: fixed;[m
[32m+[m[32m  top: 20px;[m
[32m+[m[32m  left: 20px;[m
[32m+[m[32m  right: 20px;[m
[32m+[m[32m  bottom: 20px;[m
[32m+[m[32m  z-index: 1000;[m
   display: flex;[m
[31m-  flex-wrap: wrap;[m
[31m-  gap: 12px;[m
[31m-  padding: 12px 0 0;[m
[31m-  border-top: 1px solid rgba(15, 103, 108, 0.15);[m
[32m+[m[32m  flex-direction: column;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.mapa-wrap--expandido {[m
[32m+[m[32m  flex: 1;[m
[32m+[m[32m  height: auto;[m
 }[m
 [m
[31m-.mapa-legend-row {[m
[32m+[m[32m.mapa-ruta-acciones {[m
   display: flex;[m
   align-items: center;[m
   gap: 8px;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pager-btn {[m
   font-size: 12px;[m
[31m-  color: var(--text-light);[m
[32m+[m[32m  font-weight: 600;[m
[32m+[m[32m  color: var(--primary);[m
[32m+[m[32m  background: #fff;[m
[32m+[m[32m  border: 1px solid rgba(15, 103, 108, 0.3);[m
[32m+[m[32m  border-radius: 8px;[m
[32m+[m[32m  padding: 7px 14px;[m
[32m+[m[32m  cursor: pointer;[m
 }[m
 [m
[31m-.mapa-legend-dot {[m
[31m-  width: 10px;[m
[31m-  height: 10px;[m
[31m-  border-radius: 50%;[m
[32m+[m[32m.pager-btn:hover:not(:disabled) {[m
[32m+[m[32m  background: var(--primary);[m
[32m+[m[32m  color: #fff;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pager-btn:disabled {[m
[32m+[m[32m  opacity: 0.4;[m
[32m+[m[32m  cursor: not-allowed;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32m.pager-info {[m
[32m+[m[32m  font-size: 12px;[m
[32m+[m[32m  font-weight: 600;[m
[32m+[m[32m  color: var(--text-light);[m
 }[m
 [m
 /* ===== LISTA DE CAMIONES ===== */[m
[36m@@ -578,8 +608,8 @@[m
     flex-direction: column;[m
   }[m
 [m
[31m-  .mapa-svg {[m
[31m-    max-height: 220px;[m
[32m+[m[32m  .mapa-wrap {[m
[32m+[m[32m    height: 240px;[m
   }[m
 }[m
 [m
[1mdiff --git a/src/Pages/Dashboard/Dashboard.tsx b/src/Pages/Dashboard/Dashboard.tsx[m
[1mindex 653b3a5..58b2d40 100644[m
[1m--- a/src/Pages/Dashboard/Dashboard.tsx[m
[1m+++ b/src/Pages/Dashboard/Dashboard.tsx[m
[36m@@ -1,9 +1,7 @@[m
 // Dashboard.tsx - Componente principal del dashboard de monitoreo de flota[m
[31m-import { useState, useEffect, useRef } from 'react';[m
[32m+[m[32mimport { useState, useEffect } from 'react';[m
 import { FiAlertTriangle } from 'react-icons/fi';[m
[31m-import camionRojo from '../../assets/camion-rojo.png';[m
[31m-import camionNaranja from '../../assets/camion-naranja.png';[m
[31m-import camionVerde from '../../assets/camion-verde.png';[m
[32m+[m[32mimport MapaSuchiapa, { type CamionMapa } from './mapa/MapaSuchiapa';[m
 import { apiRequest } from '../../services/api';[m
 import { ROLES } from '../../services/auth';[m
 import './Dashboard.css';[m
[36m@@ -97,10 +95,6 @@[m [mfunction labelDisponibilidad(nombre: string): string {[m
   }[m
 }[m
 [m
[31m-interface Posiciones {[m
[31m-  [key: string]: { t: number };[m
[31m-}[m
[31m-[m
 // ─── Datos simulados ──────────────────────────────────────────────────────────[m
 [m
 const RUTAS_INICIALES: Ruta[] = [[m
[36m@@ -109,38 +103,20 @@[m [mconst RUTAS_INICIALES: Ruta[] = [[m
   { id: '03', nombre: 'Camión 3', conductor: '',  estado: 'ok',         progreso: 100, color: '#639922', badge: 'Completado' },[m
 ];[m
 [m
[31m-// Rutas en el SVG (viewBox 460x220). Cada array = waypoints [x, y][m
[31m-const MAP_PATHS: Record<string, number[][]> = {[m
[31m-  '01': [[20,56],[65,56],[65,116],[160,116],[220,56],[270,56]],[m
[31m-  '02': [[390,116],[270,116],[270,56],[165,56],[165,116],[65,116],[65,176]],[m
[31m-  '03': [[20,176],[65,176],[165,176],[270,176],[380,176],[450,176]],[m
[32m+[m[32m// Rutas geográficas reales sobre Suchiapa, Chiapas. Cada array = waypoints [lat, lng][m
[32m+[m[32mconst RUTAS_GEO: Record<string, [number, number][]> = {[m
[32m+[m[32m  '01': [[16.6205, -93.1042], [16.6198, -93.1015], [16.6185, -93.0998], [16.617, -93.0985]],[m
[32m+[m[32m  '02': [[16.612, -93.108], [16.6135, -93.1055], [16.615, -93.103], [16.6166, -93.1005]],[m
[32m+[m[32m  '03': [[16.6095, -93.0965], [16.611, -93.098], [16.613, -93.0995], [16.615, -93.101]],[m
 };[m
 [m
[31m-// ─── Helpers ──────────────────────────────────────────────────────────────────[m
[31m-[m
[31m-function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }[m
[31m-[m
[31m-function getTruckPos(path: number[][], t: number): [number, number] {[m
[31m-  const segs = path.length - 1;[m
[31m-  const seg  = Math.min(Math.floor(t * segs), segs - 1);[m
[31m-  const local = (t * segs) - seg;[m
[31m-  const a = path[seg], b = path[seg + 1];[m
[31m-  return [lerp(a[0], b[0], local), lerp(a[1], b[1], local)];[m
[31m-}[m
[32m+[m[32mconst ESTADO_ICONO: Record<string, CamionMapa['estadoIcono']> = {[m
[32m+[m[32m  alerta: 'parado',[m
[32m+[m[32m  advertencia: 'retrasado',[m
[32m+[m[32m  ok: 'activo',[m
[32m+[m[32m};[m
 [m
[31m-function buildPolylinePoints(path: number[][], t: number): string {[m
[31m-  if (t >= 1) return path.map(p => p.join(',')).join(' ');[m
[31m-  const segs = path.length - 1;[m
[31m-  const end  = t * segs;[m
[31m-  const seg  = Math.floor(end);[m
[31m-  const local = end - seg;[m
[31m-  const pts = path.slice(0, seg + 1).map(p => p.join(','));[m
[31m-  if (seg < path.length - 1) {[m
[31m-    const a = path[seg], b = path[seg + 1];[m
[31m-    pts.push([lerp(a[0], b[0], local).toFixed(1), lerp(a[1], b[1], local).toFixed(1)].join(','));[m
[31m-  }[m
[31m-  return pts.join(' ');[m
[31m-}[m
[32m+[m[32m// ─── Helpers ──────────────────────────────────────────────────────────────────[m
 [m
 function pad(n: number): string { return String(n).padStart(2, '0'); }[m
 [m
[36m@@ -156,116 +132,6 @@[m [mfunction esHoy(fecha: string): boolean {[m
   return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();[m
 }[m
 [m
[31m-// ─── Mini mapa SVG ────────────────────────────────────────────────────────────[m
[31m-[m
[31m-function MiniMapa({ rutas }: { rutas: Ruta[] }) {[m
[31m-  const [positions, setPositions] = useState<Posiciones>({[m
[31m-    '01': { t: RUTAS_INICIALES[0].progreso / 100 },[m
[31m-    '02': { t: RUTAS_INICIALES[1].progreso / 100 },[m
[31m-    '03': { t: RUTAS_INICIALES[2].progreso / 100 },[m
[31m-  });[m
[31m-  const rafRef = useRef<number | null>(null);[m
[31m-[m
[31m-  useEffect(() => {[m
[31m-    function animate() {[m
[31m-      setPositions(prev => {[m
[31m-        const next = { ...prev };[m
[31m-        // Solo los camiones 02 y 03 se mueven en ciclo continuo[m
[31m-        // El camión 01 permanece en su posición inicial[m
[31m-        next['02'] = { t: (prev['02'].t + 0.0015) % 1 }; // Ciclo continuo[m
[31m-        next['03'] = { t: (prev['03'].t + 0.0012) % 1 }; // Ciclo continuo (velocidad ligeramente diferente)[m
[31m-        return next;[m
[31m-      });[m
[31m-      rafRef.current = requestAnimationFrame(animate);[m
[31m-    }[m
[31m-    rafRef.current = requestAnimationFrame(animate);[m
[31m-    return () => {[m
[31m-      if (rafRef.current !== null) {[m
[31m-        cancelAnimationFrame(rafRef.current);[m
[31m-      }[m
[31m-    };[m
[31m-  }, []);[m
[31m-[m
[31m-  const estadoColor: Record<string, string> = { alerta: '#E24B4A', advertencia: '#BA7517', ok: '#639922' };[m
[31m-[m
[31m-  return ([m
[31m-    <div className="mapa-wrap">[m
[31m-      <svg viewBox="0 0 460 220" className="mapa-svg" xmlns="http://www.w3.org/2000/svg">[m
[31m-        {/* Fondo */}[m
[31m-        <rect width="460" height="220" fill="#e8eeea" />[m
[31m-[m
[31m-        {/* Calles horizontales */}[m
[31m-        {[50, 110, 170].map(y => ([m
[31m-          <rect key={y} x="0" y={y} width="460" height="12" fill="#d4dcd6" opacity=".7" />[m
[31m-        ))}[m
[31m-        {/* Calles verticales */}[m
[31m-        {[60, 160, 270, 380].map(x => ([m
[31m-          <rect key={x} x={x} y="0" width="10" height="220" fill="#d4dcd6" opacity=".7" />[m
[31m-        ))}[m
[31m-[m
[31m-        {/* Manzanas */}[m
[31m-        {[[m
[31m-          [10,20,40,25],[80,20,70,25],[80,65,70,38],[175,20,85,25],[175,65,85,38],[m
[31m-          [285,20,85,25],[285,65,85,38],[395,20,55,25],[80,125,70,38],[175,125,85,38],[m
[31m-          [285,125,85,38],[395,125,55,38],[10,185,40,28],[80,185,70,28],[175,185,85,28],[m
[31m-        ].map(([x,y,w,h], i) => ([m
[31m-          <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#c8d4ca" />[m
[31m-        ))}[m
[31m-[m
[31m-        {/* Rutas trazadas */}[m
[31m-        {rutas.map(r => {[m
[31m-          const path = MAP_PATHS[r.id];[m
[31m-          const t    = positions[r.id]?.t ?? r.progreso / 100;[m
[31m-          const pts  = buildPolylinePoints(path, t);[m
[31m-          const color = estadoColor[r.estado] ?? '#888';[m
[31m-          return ([m
[31m-            <polyline[m
[31m-              key={r.id}[m
[31m-              points={pts}[m
[31m-              fill="none"[m
[31m-              stroke={color}[m
[31m-              strokeWidth="2.5"[m
[31m-              strokeDasharray={r.estado === 'ok' ? 'none' : '5,3'}[m
[31m-              opacity=".85"[m
[31m-            />[m
[31m-          );[m
[31m-        })}[m
[31m-[m
[31m-        {/* Camiones */}[m
[31m-        {rutas.map(r => {[m
[31m-          const path = MAP_PATHS[r.id];[m
[31m-          const t    = positions[r.id]?.t ?? r.progreso / 100;[m
[31m-          const [cx, cy] = getTruckPos(path, t);[m
[31m-          let camionImage = camionVerde;[m
[31m-          if (r.id === '01') camionImage = camionRojo;[m
[31m-          else if (r.id === '02') camionImage = camionNaranja;[m
[31m-          return ([m
[31m-            <image[m
[31m-              key={r.id}[m
[31m-              href={camionImage}[m
[31m-              x={cx - 12}[m
[31m-              y={cy - 8}[m
[31m-              width="24"[m
[31m-              height="16"[m
[31m-              opacity="0.9"[m
[31m-            />[m
[31m-          );[m
[31m-        })}[m
[31m-      </svg>[m
[31m-[m
[31m-      {/* Leyenda */}[m
[31m-      <div className="mapa-legend">[m
[31m-        {rutas.map(r => ([m
[31m-          <div key={r.id} className="mapa-legend-row">[m
[31m-            <span className="mapa-legend-dot" style={{ background: estadoColor[r.estado] }} />[m
[31m-            <span>{r.nombre} · {r.badge}</span>[m
[31m-          </div>[m
[31m-        ))}[m
[31m-      </div>[m
[31m-    </div>[m
[31m-  );[m
[31m-}[m
[31m-[m
 // ─── Componente principal ─────────────────────────────────────────────────────[m
 [m
 export default function Dashboard() {[m
[36m@@ -273,6 +139,9 @@[m [mexport default function Dashboard() {[m
   const [seleccionado, setSeleccionado] = useState<string | null>(null);[m
   const [ahora, setAhora]              = useState(new Date());[m
 [m
[32m+[m[32m  const [modoRuta, setModoRuta] = useState(false);[m
[32m+[m[32m  const [puntosRuta, setPuntosRuta] = useState<[number, number][]>([]);[m
[32m+[m
   const [anomalias, setAnomalias] = useState<Anomalia[]>([]);[m
   const [loadingAnomalias, setLoadingAnomalias] = useState(true);[m
   const [errorAnomalias, setErrorAnomalias] = useState<string | null>(null);[m
[36m@@ -424,6 +293,28 @@[m [mexport default function Dashboard() {[m
 [m
   const rutasActivas = rutasFiltro.filter(r => !r.eliminado).length;[m
 [m
[32m+[m[32m  const camionesMapa: CamionMapa[] = rutas.map(r => ({[m
[32m+[m[32m    id: r.id,[m
[32m+[m[32m    nombre: r.nombre,[m
[32m+[m[32m    color: r.color,[m
[32m+[m[32m    estadoIcono: ESTADO_ICONO[r.estado] ?? 'activo',[m
[32m+[m[32m    ruta: RUTAS_GEO[r.id] ?? [],[m
[32m+[m[32m  }));[m
[32m+[m
[32m+[m[32m  const activarModoRuta = () => {[m
[32m+[m[32m    setPuntosRuta([]);[m
[32m+[m[32m    setModoRuta(true);[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const cancelarModoRuta = () => {[m
[32m+[m[32m    setModoRuta(false);[m
[32m+[m[32m    setPuntosRuta([]);[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const agregarPuntoRuta = (punto: [number, number]) => {[m
[32m+[m[32m    setPuntosRuta(prev => [...prev, punto]);[m
[32m+[m[32m  };[m
[32m+[m
  // SOLO cambia la parte del render (return)[m
 [m
 return ([m
