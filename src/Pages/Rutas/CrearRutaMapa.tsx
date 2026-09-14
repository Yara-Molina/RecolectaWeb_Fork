import { useState, useEffect, useMemo } from 'react';
import { FiChevronDown, FiCornerUpLeft } from 'react-icons/fi';
import MapaSuchiapa from '../Dashboard/mapa/MapaSuchiapa';
import type { Coordenada } from '../Dashboard/mapa/geo';
import { obtenerDireccionCompleta } from '../Dashboard/mapa/geocodificacion';
import { apiRequest, ApiError } from '../../services/api';
import { alertaExito, alertaAviso, alertaCargando, alertaError } from '../../util/alertas';
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

export interface RutaEnEdicion {
  ruta_id: number;
  nombre: string;
  conductor_id: number | null;
  puntos: Array<{ lat: number; lng: number; nombre?: string; direccion?: string; cp?: string | null }>;
}

export default function CrearRutaMapa({
  onRutaCreada,
  rutaEnEdicion = null,
  onCancelarEdicion,
}: {
  onRutaCreada: () => void;
  /** Si viene, el panel edita los puntos de esa ruta en lugar de crear una. */
  rutaEnEdicion?: RutaEnEdicion | null;
  onCancelarEdicion?: () => void;
}) {
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([BASE_INICIO]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState('');
  const [conductorSeleccionado, setConductorSeleccionado] = useState<number | null>(null);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);
  const [conductores, setConductores] = useState<ConductorOpcion[]>([]);

  const [previsualizando, setPrevisualizando] = useState(false);

  // Traza real que devuelve el AG: es lo que dibuja el mapa como recorrido, en
  // lugar de la vieja linea OSRM. La previsualizacion la pide SIN persistir la
  // ruta (endpoint /api/rutas/preview), asi que no exige conductor ni crea
  // nada. Se invalida al cambiar los puntos, porque dejaria de corresponder.
  const [trazaReal, setTrazaReal] = useState<Coordenada[] | null>(null);

  // Identidad estable: sin esto el array se recrea en cada render y el efecto
  // de MapaSuchiapa que calcula la ruta por calles entra en bucle.
  const coordenadas = useMemo(
    () => puntosRuta.map((p) => [p.lat, p.lng] as [number, number]),
    [puntosRuta],
  );

  // Al entrar en edicion se precargan sus puntos; al salir, se vuelve al
  // estado inicial de creacion.
  useEffect(() => {
    if (!rutaEnEdicion) {
      reiniciar();
      return;
    }
    setNombreRutaNueva(rutaEnEdicion.nombre);
    setConductorSeleccionado(rutaEnEdicion.conductor_id);
    setErrorRuta(null);
    setPuntosRuta([
      BASE_INICIO,
      ...rutaEnEdicion.puntos.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        direccion: p.direccion || p.nombre || 'Punto de recoleccion',
        // Se conserva el codigo postal ya guardado: volver a geocodificar
        // cada punto al editar seria lento y golpearia a Nominatim sin
        // necesidad.
        direccionCompleta: p.cp ? { display_name: p.direccion ?? '', cp: p.cp } : null,
      })),
    ]);
  }, [rutaEnEdicion]);

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
    setTrazaReal(null);
  };

  const agregarPuntoRuta = async (punto: [number, number]) => {
    const [lat, lng] = punto;

    // No permitir agregar más puntos si se hace clic en la base de inicio
    if (lat === BASE_INICIO.lat && lng === BASE_INICIO.lng) {
      return;
    }

    // La traza del AG mostrada deja de ser valida en cuanto cambian los puntos.
    setTrazaReal(null);

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

  // Previsualiza el recorrido real SIN guardar nada: manda los puntos actuales
  // al AG (a traves de /api/rutas/preview, que no toca la base) y dibuja la
  // geometria que devuelve. No requiere conductor ni nombre.
  const previsualizarRutaReal = async () => {
    setErrorRuta(null);
    if (puntosRuta.length < 3) {
      setErrorRuta('Coloca la base y al menos 2 puntos para previsualizar el recorrido.');
      return;
    }

    setPrevisualizando(true);
    // Mensaje de proceso en curso (se reemplaza al terminar por éxito o error).
    alertaCargando(
      'Procesando ruta',
      'Calculando el recorrido óptimo por las calles con el algoritmo…',
    );
    try {
      const ultimo = puntosRuta[puntosRuta.length - 1];
      const intermedios = puntosRuta.slice(1, -1);
      const payload = {
        base_inicio: { lat: BASE_INICIO.lat, lng: BASE_INICIO.lng, nombre: 'Base Inicio' },
        base_fin: { lat: ultimo.lat, lng: ultimo.lng, nombre: 'Base Fin' },
        puntos: intermedios.map((p, i) => ({
          id: String(i + 1),
          lat: p.lat,
          lng: p.lng,
          nombre: p.direccion || `Punto ${i + 1}`,
        })),
        bloqueos: [],
      };

      const resp = await apiRequest<{
        success: boolean;
        data?: { coordenadas?: Coordenada[]; distancia_total_km?: number };
      }>('/api/rutas/preview', { method: 'POST', body: JSON.stringify(payload) });

      const coords = resp.data?.coordenadas;
      if (resp.success && Array.isArray(coords) && coords.length >= 2) {
        setTrazaReal(coords);
        const km = resp.data?.distancia_total_km;
        await alertaExito(
          'Ruta terminada',
          `El mapa muestra el recorrido real que seguirá el conductor.${
            km != null ? `\nDistancia total: ${km} km` : ''
          }`,
        );
      } else {
        setTrazaReal(null);
        await alertaError(
          'Error al procesar la ruta',
          'El optimizador no devolvió un recorrido válido. Revisa los puntos o comprueba que el servicio del algoritmo esté disponible.',
        );
      }
    } catch (err) {
      setTrazaReal(null);
      await alertaError(
        'Error al procesar la ruta',
        err instanceof ApiError ? err.message : 'No se pudo contactar con el servicio de optimización.',
      );
    } finally {
      setPrevisualizando(false);
    }
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
      // Un conductor no puede llevar dos rutas activas a la vez: la app movil
      // consulta /rutas/activas?conductor_id=N y se queda con la de id mas
      // alto, asi que con dos activas el conductor veria una ruta arbitraria.
      if (!rutaEnEdicion) {
        const activas = await apiRequest<{ success: boolean; data: Array<{ ruta_id: number; nombre: string }> }>(
          `/api/rutas/activas?conductor_id=${conductorSeleccionado}`,
        );
        const enCurso = activas.data ?? [];
        if (enCurso.length > 0) {
          setGuardandoRuta(false);
          setErrorRuta(
            `${conductores.find((c) => c.id === conductorSeleccionado)?.nombre ?? 'Ese conductor'} ` +
              `ya tiene una ruta activa ("${enCurso[0].nombre}"). Desactivala desde el listado ` +
              'antes de asignarle otra.',
          );
          return;
        }
      }

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

      const jsonRuta = {
        type: 'LineString',
        coordinates: puntosRuta.map(p => [p.lng, p.lat]),
        puntos: puntosCompletos, // Todos los puntos con lat, lng, direccion
        base_inicio: baseInicio,
        base_fin: baseFin,
      };

      let rutaId: number;
      let puntosAEliminar: number[] = [];

      if (rutaEnEdicion) {
        // 1a. Editar: se conservan nombre y conductor, solo cambian los puntos.
        rutaId = rutaEnEdicion.ruta_id;
        await apiRequest(`/api/rutas/${rutaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            descripcion: `Ruta editada desde el dashboard con ${puntosRuta.length - 1} puntos. Asignada a ${conductorNombre}.`,
            json_ruta: jsonRuta,
          }),
        });

        // Los puntos se reemplazan, no se actualizan uno a uno: el orden y el
        // numero cambian con la edicion, y el AG reescribe las esquinas.
        //
        // Solo se anotan aqui; se borran DESPUES de crear los nuevos. Borrar
        // primero dejaba la ruta sin puntos si la creacion fallaba a medias, y
        // una ruta vacia desaparece de la app del conductor sin aviso. Al
        // invertir el orden, un fallo deja puntos duplicados: visible y
        // recuperable, en lugar de silencioso.
        const previos = await apiRequest<{ success: boolean; data: Array<{ punto_id: number }> }>(
          `/api/puntos-recoleccion/ruta/${rutaId}`,
        );
        puntosAEliminar = (previos.data ?? []).map((p) => p.punto_id);
      } else {
        // 1b. Crear la ruta con conductor asignado y los puntos en json_ruta
        const rutaResponse = await apiRequest<{ success: boolean; data: { ruta_id: number } }>('/api/rutas/', {
          method: 'POST',
          body: JSON.stringify({
            nombre: nombreRutaNueva.trim(),
            descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length - 1} puntos. Asignada a ${conductorNombre}.`,
            conductor_id: conductorSeleccionado,
            json_ruta: jsonRuta,
          }),
        });
        rutaId = rutaResponse.data.ruta_id;
      }

      // 2. Crear puntos de recolección (contrato api_rutas: ruta_id, lat, lon
      //    requeridos; el resto opcional pero necesario para el AG)
      console.log('Creando puntos de recolección para ruta', rutaId);
      for (let i = 0; i < puntosCompletos.length; i++) {
        const punto = puntosCompletos[i];
        // `cp` es VARCHAR(10) en api_rutas: solo cabe un codigo postal. El
        // codigo anterior caia a la direccion completa cuando faltaba, y MySQL
        // rechazaba la fila con "Data too long for column 'cp'". La direccion
        // ya viaja en su propia columna, asi que aqui se deja vacio.
        const cpBruto = (punto.cp ?? '').trim();
        const cp = cpBruto.length > 0 && cpBruto.length <= 10 ? cpBruto : null;

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

      // Los nuevos puntos ya estan escritos: ahora si se pueden retirar los
      // anteriores sin riesgo de dejar la ruta vacia.
      for (const puntoId of puntosAEliminar) {
        await apiRequest(`/api/puntos-recoleccion/${puntoId}`, { method: 'DELETE' });
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

  const numPuntos = puntosRuta.length - 1;
  const ocupado = guardandoRuta || previsualizando;

  return (
    <section className="crear-ruta">
      <div className="crear-ruta-grid">
        <aside className="cr-sidebar">
          <div className="cr-sidebar-scroll">
            <h3 className="cr-sidebar-title">
              {rutaEnEdicion ? `Editar "${rutaEnEdicion.nombre}"` : 'Crear ruta'}
            </h3>
            <p className="cr-sidebar-instr">
              {rutaEnEdicion
                ? 'Añade o quita puntos. El nombre y el conductor no se modifican aquí.'
                : 'Sigue los pasos a continuación:'}
            </p>

            <div className="cr-step">
              <span className="cr-step-num">1</span>
              <span className="cr-step-label">Nombre de la ruta</span>
            </div>
            <input
              className="cr-input"
              placeholder="Nombre de la ruta"
              value={nombreRutaNueva}
              onChange={(e) => setNombreRutaNueva(e.target.value)}
              disabled={!!rutaEnEdicion}
            />

            <div className="cr-step">
              <span className="cr-step-num">2</span>
              <span className="cr-step-label">Conductor asignado</span>
            </div>
            <div className="cr-select-wrap">
              <select
                className="cr-select"
                value={conductorSeleccionado ?? ''}
                onChange={(e) => setConductorSeleccionado(e.target.value ? Number(e.target.value) : null)}
                disabled={!!rutaEnEdicion}
              >
                <option value="">Selecciona conductor</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <FiChevronDown className="cr-select-chevron" aria-hidden />
            </div>

            <div className="cr-step">
              <span className="cr-step-num">3</span>
              <span className="cr-step-label">Marca los puntos en el mapa</span>
            </div>
            <span className="cr-badge">
              {numPuntos} punto{numPuntos === 1 ? '' : 's'} agregado{numPuntos === 1 ? '' : 's'}
            </span>

            {numPuntos > 0 && (
              <ol className="cr-points">
                {puntosRuta.map((p, i) => (
                  <li key={`${p.lat}-${p.lng}-${i}`} className="cr-point">
                    <span className="cr-point-num">{i === 0 ? 'B' : i}</span>
                    <span className="cr-point-dir">{p.direccion}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="cr-actions">
            {errorRuta && <p className="crear-ruta-error">{errorRuta}</p>}
            <button
              type="button"
              className="cr-btn cr-btn-primary"
              onClick={guardarRuta}
              disabled={ocupado}
            >
              {guardandoRuta ? 'GUARDANDO…' : rutaEnEdicion ? 'GUARDAR CAMBIOS' : 'GUARDAR RUTA'}
            </button>
            <button
              type="button"
              className="cr-btn cr-btn-secondary"
              onClick={previsualizarRutaReal}
              disabled={ocupado || puntosRuta.length < 3}
              title="Dibuja el recorrido real por calles (no guarda nada ni requiere conductor)"
            >
              {previsualizando ? 'Previsualizando…' : 'Previsualizar ruta real'}
            </button>
            {rutaEnEdicion && onCancelarEdicion && (
              <button
                type="button"
                className="cr-btn cr-btn-ghost"
                onClick={onCancelarEdicion}
                disabled={ocupado}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </aside>

        <div className="crear-ruta-mapa">
          <MapaSuchiapa
            camiones={[]}
            seleccionable
            puntos={coordenadas}
            trazaReal={trazaReal ?? undefined}
            onAgregarPunto={agregarPuntoRuta}
          />
          <button
            type="button"
            className="cr-map-undo"
            onClick={() => {
              setTrazaReal(null);
              setPuntosRuta((prev) => prev.slice(0, -1));
            }}
            disabled={puntosRuta.length <= 1 || ocupado}
          >
            <FiCornerUpLeft aria-hidden /> Deshacer
          </button>
        </div>
      </div>
    </section>
  );
}
