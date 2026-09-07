import { useState, useEffect, useMemo } from 'react';
import MapaSuchiapa from '../Dashboard/mapa/MapaSuchiapa';
import { obtenerDireccionCompleta } from '../Dashboard/mapa/geocodificacion';
import { apiRequest, ApiError } from '../../services/api';
import { alertaExito, alertaAviso } from '../../util/alertas';
import { ROLES } from '../../services/auth';
import './CrearRutaMapa.css';

// Creacion de rutas sobre el mapa. Vivia dentro del Dashboard, donde competia
// con el mapa de seguimiento en tiempo real: alli se consultan las rutas
// activas, aqui se dan de alta.

interface DireccionCompleta {
  display_name: string;
  calle?: string | null;
  cp?: string | null;
  colonia?: string | null;
  municipio?: string | null;
  estado?: string | null;
}

interface PuntoRuta {
  lat: number;
  lng: number;
  direccion: string;
  direccionCompleta: DireccionCompleta | null;
}

interface ConductorOpcion {
  id: number;
  nombre: string;
}

// Base de inicio fija: deposito desde donde salen los camiones.
// Los datos de direccion corresponden a la geocodificacion inversa de estas
// coordenadas en Nominatim; si mueves la base, actualizalos tambien.
const BASE_INICIO: PuntoRuta = {
  lat: 16.626879,
  lng: -93.105022,
  direccion: 'BASE INICIAL: Calle Segunda Norte Poniente, Suchiapa, Chiapas, 29150, Mexico',
  direccionCompleta: {
    display_name: 'Calle Segunda Norte Poniente, Suchiapa, Chiapas, 29150, Mexico',
    calle: 'Calle Segunda Norte Poniente',
    cp: '29150',
    colonia: null,
    municipio: 'Suchiapa',
    estado: 'Chiapas',
  },
};

export default function CrearRutaMapa({ onRutaCreada }: { onRutaCreada: () => void }) {
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([BASE_INICIO]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState<number | null>(null);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);
  const [conductores, setConductores] = useState<ConductorOpcion[]>([]);

  // Identidad estable: sin esto el array se recrea en cada render y el efecto
  // de MapaSuchiapa que calcula la ruta por calles entra en bucle.
  const coordenadas = useMemo(
    () => puntosRuta.map((p) => [p.lat, p.lng] as [number, number]),
    [puntosRuta],
  );

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const response = await apiRequest<{ data: Record<string, unknown>[] }>('/api/empleados/');
        if (cancelado) return;
        setConductores(
          (response.data ?? [])
            .filter((u) => u.rol_id === ROLES.CONDUCTOR)
            .map((u) => ({
              id: Number(u.id ?? 0),
              nombre: typeof u.nombre === 'string' && u.nombre ? u.nombre : `Conductor #${u.id}`,
            })),
        );
      } catch {
        // /api/empleados/ exige rol ADMIN. Sin permisos el selector queda
        // vacio, que ya comunica que no se puede asignar conductor.
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Toda ruta arranca en la base: es el deposito del que salen los camiones.
  const reiniciar = () => {
    setPuntosRuta([BASE_INICIO]);
    setNombreRutaNueva('');
    setConductorSeleccionado(null);
    setErrorRuta(null);
  };

  const agregarPuntoRuta = async (punto: [number, number]) => {
    const [lat, lng] = punto;

    // No permitir agregar más puntos si se hace clic en la base de inicio
    if (lat === BASE_INICIO.lat && lng === BASE_INICIO.lng) {
      return;
    }

    setPuntosRuta(prev => [...prev, { lat, lng, direccion: 'Buscando dirección…', direccionCompleta: null }]);

    const direccionCompleta = await obtenerDireccionCompleta(punto);

    setPuntosRuta(prev =>
      prev.map(p => (p.lat === lat && p.lng === lng ? {
        ...p,
        direccion: direccionCompleta?.display_name || 'Sin dirección disponible',
        direccionCompleta
      } : p)),
    );
  };

  const guardarRuta = async () => {
    if (!nombreRutaNueva.trim()) {
      setErrorRuta('Ponle un nombre a la ruta antes de guardarla.');
      return;
    }

    if (puntosRuta.length < 2) {
      setErrorRuta('Selecciona al menos 1 punto además de la base inicial.');
      return;
    }

    if (!conductorSeleccionado) {
      setErrorRuta('Selecciona un conductor antes de guardar la ruta.');
      return;
    }

    setGuardandoRuta(true);
    setErrorRuta(null);

    try {
      // Preparar base_inicio y base_fin para el AG
      const baseInicio = {
        lat: BASE_INICIO.lat,
        lng: BASE_INICIO.lng,
        nombre: 'Base Inicio'
      };

      // El último punto será la base de fin
      const ultimoPunto = puntosRuta[puntosRuta.length - 1];
      const baseFin = {
        lat: ultimoPunto.lat,
        lng: ultimoPunto.lng,
        nombre: 'Base Fin'
      };

      const conductorNombre = conductores.find(c => c.id === conductorSeleccionado)?.nombre || 'Sin asignar';

      // Construir array completo de puntos con toda la info (lat, lng, direccion, calle...)
      const puntosCompletos = puntosRuta.map((p, i) => {
        const esBaseInicio = i === 0;
        const esBaseFin = i === puntosRuta.length - 1;
        const dir = p.direccionCompleta;
        return {
          id: i + 1,
          orden: i + 1,
          lat: p.lat,
          lng: p.lng,
          nombre: p.direccion || `Punto ${i + 1}`,
          direccion: p.direccion,
          calle: dir?.calle || null,
          colonia: dir?.colonia || null,
          municipio: dir?.municipio || null,
          estado: dir?.estado || null,
          cp: dir?.cp || null,
          es_inicio: esBaseInicio,
          es_fin: esBaseFin,
        };
      });

      console.log('Guardando ruta:', nombreRutaNueva, 'con', puntosRuta.length, 'puntos');
      console.log('Asignada a:', conductorNombre, '(ID:', conductorSeleccionado, ')');
      console.log('Puntos completos:', JSON.stringify(puntosCompletos, null, 2));

      // 1. Crear la ruta con conductor asignado y TODOS los puntos en json_ruta
      const rutaResponse = await apiRequest<{ success: boolean; data: { ruta_id: number } }>('/api/rutas/', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nombreRutaNueva.trim(),
          descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length} puntos. Asignada a ${conductorNombre}.`,
          conductor_id: conductorSeleccionado,
          json_ruta: {
            type: 'LineString',
            coordinates: puntosRuta.map(p => [p.lng, p.lat]),
            puntos: puntosCompletos, // Todos los puntos con lat, lng, direccion
            base_inicio: baseInicio,
            base_fin: baseFin
          },
        }),
      });

      console.log('Ruta creada:', rutaResponse);
      const rutaId = rutaResponse.data.ruta_id;

      // 2. Crear puntos de recolección (contrato api_rutas: ruta_id, lat, lon
      //    requeridos; el resto opcional pero necesario para el AG)
      console.log('Creando puntos de recolección para ruta', rutaId);
      for (let i = 0; i < puntosCompletos.length; i++) {
        const punto = puntosCompletos[i];
        const cp =
          (punto.cp || punto.direccion || `Punto ${i + 1}`).trim() ||
          `${punto.lat},${punto.lng}`;

        await apiRequest('/api/puntos-recoleccion/', {
          method: 'POST',
          body: JSON.stringify({
            ruta_id: rutaId,
            orden: punto.orden,
            nombre: punto.nombre,
            direccion: punto.direccion,
            lat: punto.lat,
            // api_rutas usa `lon`, no `lng`
            lon: punto.lng,
            calle: punto.calle,
            colonia: punto.colonia,
            municipio: punto.municipio,
            estado: punto.estado,
            cp,
            // El AG lee es_inicio/es_fin de la tabla para fijar las bases de
            // la ruta. Sin ellos cae al primer y ultimo punto por `orden`,
            // que ademas llegaba en 0 para todos.
            es_inicio: punto.es_inicio,
            es_fin: punto.es_fin,
          }),
        });
      }

      console.log('Ruta y puntos guardados exitosamente');

      // 3. Optimizar la ruta con el AG (algoritmo genético)
      console.log('Optimizando ruta con AG...');
      try {
        const optimizacion = await apiRequest<{ success: boolean; message: string; data?: { distancia_total_km?: number } }>(`/api/rutas/${rutaId}/optimizar`, {
          method: 'POST',
        });
        console.log('Ruta optimizada por AG:', optimizacion);

        if (optimizacion.success) {
          await alertaExito(
            `Ruta "${nombreRutaNueva}" guardada y optimizada`,
            `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\nDistancia: ${optimizacion.data?.distancia_total_km || 'N/A'} km\nBase inicio: ${BASE_INICIO.direccionCompleta?.calle}\nBase fin: ${ultimoPunto.direccion}`,
          );
        } else {
          await alertaAviso(
            `Ruta "${nombreRutaNueva}" guardada sin optimizar`,
            `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\n\nEl servicio de optimización no devolvió un resultado válido.`,
          );
        }
      } catch (optErr) {
        console.warn('No se pudo optimizar con AG:', optErr);
        await alertaAviso(
          `Ruta "${nombreRutaNueva}" guardada sin optimizar`,
          `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\n\nNo se pudo contactar con el servicio de optimización de rutas.`,
        );
      }

      reiniciar();
      onRutaCreada();
    } catch (err) {
      console.error('Error guardando ruta:', err);
      setErrorRuta(err instanceof ApiError ? err.message : 'No se pudo guardar la ruta.');
    } finally {
      setGuardandoRuta(false);
    }
  };

  return (
    <section className="crear-ruta">
      <header className="crear-ruta-head">
        <div>
          <h2>Crear ruta</h2>
          <p>Marca los puntos de recoleccion en el mapa, en el orden que prefieras.</p>
        </div>
        <div className="crear-ruta-acciones">
          <input
            className="crear-ruta-nombre"
            placeholder="Nombre de la ruta"
            value={nombreRutaNueva}
            onChange={(e) => setNombreRutaNueva(e.target.value)}
          />
          <select
            className="crear-ruta-conductor"
            value={conductorSeleccionado ?? ''}
            onChange={(e) => setConductorSeleccionado(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Selecciona conductor</option>
            {conductores.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <span className="crear-ruta-contador">
            {puntosRuta.length - 1} punto{puntosRuta.length - 1 === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="pager-btn"
            onClick={() => setPuntosRuta((prev) => prev.slice(0, -1))}
            disabled={puntosRuta.length <= 1}
          >
            Deshacer
          </button>
          <button type="button" className="pager-btn" onClick={guardarRuta} disabled={guardandoRuta}>
            {guardandoRuta ? 'Guardando...' : 'Guardar ruta'}
          </button>
        </div>
      </header>

      {errorRuta && <p className="crear-ruta-error">{errorRuta}</p>}

      <div className="crear-ruta-mapa">
        <MapaSuchiapa
          camiones={[]}
          seleccionable
          puntos={coordenadas}
          onAgregarPunto={agregarPuntoRuta}
        />
      </div>

      {puntosRuta.length > 1 && (
        <ol className="crear-ruta-lista">
          {puntosRuta.map((p, i) => (
            <li key={`${p.lat}-${p.lng}-${i}`}>
              <strong>{i === 0 ? 'Base' : i}.</strong> {p.direccion}
              <span className="crear-ruta-coords">
                ({p.lat.toFixed(5)}, {p.lng.toFixed(5)})
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
