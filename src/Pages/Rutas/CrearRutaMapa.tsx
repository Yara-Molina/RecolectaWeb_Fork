import { useState, useEffect, useMemo } from "react";
import { FiChevronDown, FiCornerUpLeft } from "react-icons/fi";
import MapaSuchiapa from "../Dashboard/mapa/MapaSuchiapa";
import type { Coordenada } from "../Dashboard/mapa/geo";
import { obtenerDireccionCompleta } from "../Dashboard/mapa/geocodificacion";
import { apiRequest, ApiError } from "../../services/api";
import {
  alertaExito,
  alertaAviso,
  alertaCargando,
  alertaError,
  confirmar,
} from "../../util/alertas";
import { ROLES } from "../../services/auth";
import "./CrearRutaMapa.css";

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

const BASE_INICIO: PuntoRuta = {
  lat: 16.626879,
  lng: -93.105022,
  direccion:
    "BASE INICIAL: Calle Segunda Norte Poniente, Suchiapa, Chiapas, 29150, Mexico",
  direccionCompleta: {
    display_name:
      "Calle Segunda Norte Poniente, Suchiapa, Chiapas, 29150, Mexico",
    calle: "Calle Segunda Norte Poniente",
    cp: "29150",
    colonia: null,
    municipio: "Suchiapa",
    estado: "Chiapas",
  },
};

export interface RutaEnEdicion {
  ruta_id: number;
  nombre: string;
  conductor_id: number | null;
  dias_recoleccion?: string[] | null;
  frecuencia_semanal?: number | null;
  turno?: string | null;
  puntos: Array<{
    lat: number;
    lng: number;
    nombre?: string;
    direccion?: string;
    cp?: string | null;
  }>;
}

// `plural` sirve para el resumen ("Pasa los lunes y sábados"): lunes a viernes
// no cambian en plural, pero sábado y domingo sí.
const DIAS_SEMANA = [
  { clave: "lunes", etiqueta: "Lunes", corta: "Lun", plural: "lunes" },
  { clave: "martes", etiqueta: "Martes", corta: "Mar", plural: "martes" },
  { clave: "miercoles", etiqueta: "Miércoles", corta: "Mié", plural: "miércoles" },
  { clave: "jueves", etiqueta: "Jueves", corta: "Jue", plural: "jueves" },
  { clave: "viernes", etiqueta: "Viernes", corta: "Vie", plural: "viernes" },
  { clave: "sabado", etiqueta: "Sábado", corta: "Sáb", plural: "sábados" },
  { clave: "domingo", etiqueta: "Domingo", corta: "Dom", plural: "domingos" },
] as const;

/** "Pasa los lunes, miércoles y viernes" a partir de las claves marcadas. */
function resumenDias(claves: string[]): string {
  if (claves.length === 0) return "Aún no marcas ningún día.";
  const nombres = claves.map(
    (clave) => DIAS_SEMANA.find((d) => d.clave === clave)?.plural ?? clave,
  );
  const lista =
    nombres.length === 1
      ? nombres[0]
      : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
  return `Pasa los ${lista}`;
}

const TURNOS = [
  { clave: "matutino", etiqueta: "Matutino (08:00 - 10:00)" },
  { clave: "vespertino", etiqueta: "Vespertino (14:00 - 16:00)" },
  { clave: "nocturno", etiqueta: "Nocturno (20:00 - 22:00)" },
] as const;

export default function CrearRutaMapa({
  onRutaCreada,
  rutaEnEdicion = null,
  onCancelarEdicion,
}: {
  onRutaCreada: () => void;
  rutaEnEdicion?: RutaEnEdicion | null;
  onCancelarEdicion?: () => void;
}) {
  const [puntosRuta, setPuntosRuta] = useState<PuntoRuta[]>([BASE_INICIO]);
  const [nombreRutaNueva, setNombreRutaNueva] = useState("");
  const [diasRecoleccion, setDiasRecoleccion] = useState<string[]>([]);
  const [frecuenciaSemanal, setFrecuenciaSemanal] = useState<number | null>(
    null,
  );
  const [frecuenciaManual, setFrecuenciaManual] = useState(false);
  const [turno, setTurno] = useState("");
  const [conductorSeleccionado, setConductorSeleccionado] = useState<
    number | null
  >(null);
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState<string | null>(null);
  const [conductores, setConductores] = useState<ConductorOpcion[]>([]);

  const [previsualizando, setPrevisualizando] = useState(false);

  const [trazaReal, setTrazaReal] = useState<Coordenada[] | null>(null);

  const coordenadas = useMemo(
    () => puntosRuta.map((p) => [p.lat, p.lng] as [number, number]),
    [puntosRuta],
  );

  useEffect(() => {
    if (!rutaEnEdicion) {
      reiniciar();
      return;
    }
    setNombreRutaNueva(rutaEnEdicion.nombre);
    setConductorSeleccionado(rutaEnEdicion.conductor_id);
    setDiasRecoleccion(rutaEnEdicion.dias_recoleccion ?? []);
    setFrecuenciaSemanal(rutaEnEdicion.frecuencia_semanal ?? null);
    setFrecuenciaManual(
      rutaEnEdicion.frecuencia_semanal != null &&
        rutaEnEdicion.frecuencia_semanal !==
          (rutaEnEdicion.dias_recoleccion?.length ?? 0),
    );
    setTurno(rutaEnEdicion.turno ?? "");
    setErrorRuta(null);
    setPuntosRuta([
      BASE_INICIO,
      ...rutaEnEdicion.puntos.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        direccion: p.direccion || p.nombre || "Punto de recoleccion",
        direccionCompleta: p.cp
          ? { display_name: p.direccion ?? "", cp: p.cp }
          : null,
      })),
    ]);
  }, [rutaEnEdicion]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const response = await apiRequest<{ data: Record<string, unknown>[] }>(
          "/api/empleados/",
        );
        if (cancelado) return;
        setConductores(
          (response.data ?? [])
            .filter((u) => u.rol_id === ROLES.CONDUCTOR)
            .map((u) => ({
              id: Number(u.id ?? 0),
              nombre:
                typeof u.nombre === "string" && u.nombre
                  ? u.nombre
                  : `Conductor #${u.id}`,
            })),
        );
      } catch {}
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const reiniciar = () => {
    setPuntosRuta([BASE_INICIO]);
    setNombreRutaNueva("");
    setConductorSeleccionado(null);
    setDiasRecoleccion([]);
    setFrecuenciaSemanal(null);
    setFrecuenciaManual(false);
    setTurno("");
    setErrorRuta(null);
    setTrazaReal(null);
  };

  const alternarDia = (clave: string) => {
    setDiasRecoleccion((previos) => {
      const siguientes = previos.includes(clave)
        ? previos.filter((d) => d !== clave)
        : [...previos, clave];

      siguientes.sort(
        (a, b) =>
          DIAS_SEMANA.findIndex((d) => d.clave === a) -
          DIAS_SEMANA.findIndex((d) => d.clave === b),
      );

      if (!frecuenciaManual) {
        setFrecuenciaSemanal(siguientes.length > 0 ? siguientes.length : null);
      }
      return siguientes;
    });
  };

  const agregarPuntoRuta = async (punto: [number, number]) => {
    const [lat, lng] = punto;

    if (lat === BASE_INICIO.lat && lng === BASE_INICIO.lng) {
      return;
    }

    setTrazaReal(null);

    setPuntosRuta((prev) => [
      ...prev,
      { lat, lng, direccion: "Buscando dirección…", direccionCompleta: null },
    ]);

    const direccionCompleta = await obtenerDireccionCompleta(punto);

    setPuntosRuta((prev) =>
      prev.map((p) =>
        p.lat === lat && p.lng === lng
          ? {
              ...p,
              direccion:
                direccionCompleta?.display_name || "Sin dirección disponible",
              direccionCompleta,
            }
          : p,
      ),
    );
  };

  const previsualizarRutaReal = async () => {
    setErrorRuta(null);
    if (puntosRuta.length < 3) {
      setErrorRuta(
        "Coloca la base y al menos 2 puntos para previsualizar el recorrido.",
      );
      return;
    }

    setPrevisualizando(true);
    alertaCargando(
      "Procesando ruta",
      "Calculando el recorrido óptimo por las calles con el algoritmo…",
    );
    try {
      const ultimo = puntosRuta[puntosRuta.length - 1];
      const intermedios = puntosRuta.slice(1, -1);
      const payload = {
        base_inicio: {
          lat: BASE_INICIO.lat,
          lng: BASE_INICIO.lng,
          nombre: "Base Inicio",
        },
        base_fin: { lat: ultimo.lat, lng: ultimo.lng, nombre: "Base Fin" },
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
      }>("/api/rutas/preview", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const coords = resp.data?.coordenadas;
      if (resp.success && Array.isArray(coords) && coords.length >= 2) {
        setTrazaReal(coords);
        const km = resp.data?.distancia_total_km;
        await alertaExito(
          "Ruta terminada",
          `El mapa muestra el recorrido real que seguirá el conductor.${
            km != null ? `\nDistancia total: ${km} km` : ""
          }`,
        );
      } else {
        setTrazaReal(null);
        await alertaError(
          "Error al procesar la ruta",
          "El optimizador no devolvió un recorrido válido. Revisa los puntos o comprueba que el servicio del algoritmo esté disponible.",
        );
      }
    } catch (err) {
      setTrazaReal(null);
      await alertaError(
        "Error al procesar la ruta",
        err instanceof ApiError
          ? err.message
          : "No se pudo contactar con el servicio de optimización.",
      );
    } finally {
      setPrevisualizando(false);
    }
  };

  const guardarRuta = async () => {
    if (!nombreRutaNueva.trim()) {
      setErrorRuta("Ponle un nombre a la ruta antes de guardarla.");
      return;
    }

    if (puntosRuta.length < 2) {
      setErrorRuta("Selecciona al menos 1 punto además de la base inicial.");
      return;
    }

    if (!conductorSeleccionado) {
      setErrorRuta("Selecciona un conductor antes de guardar la ruta.");
      return;
    }

    const faltantes: string[] = [];
    if (diasRecoleccion.length === 0) faltantes.push("los días de recolección");
    if (frecuenciaSemanal == null) faltantes.push("la frecuencia semanal");

    if (faltantes.length > 0) {
      const continuar = await confirmar(
        "Falta la programación del servicio",
        `No indicaste ${faltantes.join(" ni ")}. En la app, el ciudadano verá "Por definir" en esos datos.`,
        "Guardar así",
      );
      if (!continuar) return;
    }

    setGuardandoRuta(true);
    setErrorRuta(null);

    try {
      if (!rutaEnEdicion) {
        const activas = await apiRequest<{
          success: boolean;
          data: Array<{ ruta_id: number; nombre: string }>;
        }>(`/api/rutas/activas?conductor_id=${conductorSeleccionado}`);
        const enCurso = activas.data ?? [];
        if (enCurso.length > 0) {
          setGuardandoRuta(false);
          setErrorRuta(
            `${conductores.find((c) => c.id === conductorSeleccionado)?.nombre ?? "Ese conductor"} ` +
              `ya tiene una ruta activa ("${enCurso[0].nombre}"). Desactivala desde el listado ` +
              "antes de asignarle otra.",
          );
          return;
        }
      }

      const baseInicio = {
        lat: BASE_INICIO.lat,
        lng: BASE_INICIO.lng,
        nombre: "Base Inicio",
      };

      const ultimoPunto = puntosRuta[puntosRuta.length - 1];
      const baseFin = {
        lat: ultimoPunto.lat,
        lng: ultimoPunto.lng,
        nombre: "Base Fin",
      };

      const conductorNombre =
        conductores.find((c) => c.id === conductorSeleccionado)?.nombre ||
        "Sin asignar";

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

      console.log(
        "Guardando ruta:",
        nombreRutaNueva,
        "con",
        puntosRuta.length,
        "puntos",
      );
      console.log(
        "Asignada a:",
        conductorNombre,
        "(ID:",
        conductorSeleccionado,
        ")",
      );
      console.log(
        "Puntos completos:",
        JSON.stringify(puntosCompletos, null, 2),
      );

      const jsonRuta = {
        type: "LineString",
        coordinates: puntosRuta.map((p) => [p.lng, p.lat]),
        puntos: puntosCompletos, // Todos los puntos con lat, lng, direccion
        base_inicio: baseInicio,
        base_fin: baseFin,
      };

      let rutaId: number;
      let puntosAEliminar: number[] = [];

      if (rutaEnEdicion) {
        rutaId = rutaEnEdicion.ruta_id;
        await apiRequest(`/api/rutas/${rutaId}`, {
          method: "PUT",
          body: JSON.stringify({
            descripcion: `Ruta editada desde el dashboard con ${puntosRuta.length - 1} puntos. Asignada a ${conductorNombre}.`,
            json_ruta: jsonRuta,
            dias_recoleccion: diasRecoleccion,
            frecuencia_semanal: frecuenciaSemanal,
            turno: turno || null,
          }),
        });

        const previos = await apiRequest<{
          success: boolean;
          data: Array<{ punto_id: number }>;
        }>(`/api/puntos-recoleccion/ruta/${rutaId}`);
        puntosAEliminar = (previos.data ?? []).map((p) => p.punto_id);
      } else {
        const rutaResponse = await apiRequest<{
          success: boolean;
          data: { ruta_id: number };
        }>("/api/rutas/", {
          method: "POST",
          body: JSON.stringify({
            nombre: nombreRutaNueva.trim(),
            descripcion: `Ruta creada desde el dashboard con ${puntosRuta.length - 1} puntos. Asignada a ${conductorNombre}.`,
            conductor_id: conductorSeleccionado,
            json_ruta: jsonRuta,
            dias_recoleccion: diasRecoleccion,
            frecuencia_semanal: frecuenciaSemanal,
            turno: turno || null,
          }),
        });
        rutaId = rutaResponse.data.ruta_id;
      }

      console.log("Creando puntos de recolección para ruta", rutaId);
      for (let i = 0; i < puntosCompletos.length; i++) {
        const punto = puntosCompletos[i];
        const cpBruto = (punto.cp ?? "").trim();
        const cp = cpBruto.length > 0 && cpBruto.length <= 10 ? cpBruto : null;

        await apiRequest("/api/puntos-recoleccion/", {
          method: "POST",
          body: JSON.stringify({
            ruta_id: rutaId,
            orden: punto.orden,
            nombre: punto.nombre,
            direccion: punto.direccion,
            lat: punto.lat,
            lon: punto.lng,
            calle: punto.calle,
            colonia: punto.colonia,
            municipio: punto.municipio,
            estado: punto.estado,
            cp,
            es_inicio: punto.es_inicio,
            es_fin: punto.es_fin,
          }),
        });
      }

      for (const puntoId of puntosAEliminar) {
        await apiRequest(`/api/puntos-recoleccion/${puntoId}`, {
          method: "DELETE",
        });
      }

      console.log("Ruta y puntos guardados exitosamente");

      console.log("Optimizando ruta con AG...");
      try {
        const optimizacion = await apiRequest<{
          success: boolean;
          message: string;
          data?: { distancia_total_km?: number };
        }>(`/api/rutas/${rutaId}/optimizar`, {
          method: "POST",
        });
        console.log("Ruta optimizada por AG:", optimizacion);

        if (optimizacion.success) {
          await alertaExito(
            `Ruta "${nombreRutaNueva}" guardada y optimizada`,
            `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\nDistancia: ${optimizacion.data?.distancia_total_km || "N/A"} km\nBase inicio: ${BASE_INICIO.direccionCompleta?.calle}\nBase fin: ${ultimoPunto.direccion}`,
          );
        } else {
          await alertaAviso(
            `Ruta "${nombreRutaNueva}" guardada sin optimizar`,
            `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\n\nEl servicio de optimización no devolvió un resultado válido.`,
          );
        }
      } catch (optErr) {
        console.warn("No se pudo optimizar con AG:", optErr);
        await alertaAviso(
          `Ruta "${nombreRutaNueva}" guardada sin optimizar`,
          `Puntos: ${puntosRuta.length}\nAsignada a: ${conductorNombre}\n\nNo se pudo contactar con el servicio de optimización de rutas.`,
        );
      }

      reiniciar();
      onRutaCreada();
    } catch (err) {
      console.error("Error guardando ruta:", err);
      setErrorRuta(
        err instanceof ApiError ? err.message : "No se pudo guardar la ruta.",
      );
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
              {rutaEnEdicion
                ? `Editar "${rutaEnEdicion.nombre}"`
                : "Crear ruta"}
            </h3>
            <p className="cr-sidebar-instr">
              {rutaEnEdicion
                ? "Añade o quita puntos y ajusta la programación. El nombre y el conductor no se modifican aquí."
                : "Sigue los pasos a continuación"}
            </p>

            <div className="cr-step">
              <span className="cr-step-num">1</span>
              <span className="cr-step-label">Nombre de la ruta</span>
            </div>
            <input
              className="cr-input"
              placeholder="Ej. Ruta Centro — Lunes"
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
                value={conductorSeleccionado ?? ""}
                onChange={(e) =>
                  setConductorSeleccionado(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                disabled={!!rutaEnEdicion}
              >
                <option value="">Selecciona conductor</option>
                {conductores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <FiChevronDown className="cr-select-chevron" aria-hidden />
            </div>

            <div className="cr-step">
              <span className="cr-step-num">3</span>
              <span className="cr-step-label">Programación del servicio</span>
            </div>
            <p className="cr-field-hint">
              Es lo que ve el ciudadano en su perfil: qué días pasa el camión y
              en qué horario.
            </p>

            <span className="cr-field-label">
              Días de recolección
              {diasRecoleccion.length === 0 && (
                <span className="cr-field-falta" title="Sin definir" />
              )}
            </span>
            <div className="cr-dias" role="group" aria-label="Días de recolección">
              {DIAS_SEMANA.map((dia) => {
                const activo = diasRecoleccion.includes(dia.clave);
                return (
                  <button
                    key={dia.clave}
                    type="button"
                    className={`cr-dia${activo ? " cr-dia--activo" : ""}`}
                    aria-pressed={activo}
                    aria-label={dia.etiqueta}
                    onClick={() => alternarDia(dia.clave)}
                  >
                    {dia.corta}
                  </button>
                );
              })}
            </div>
            <p
              className={
                diasRecoleccion.length > 0 ? "cr-dias-resumen" : "cr-field-hint"
              }
            >
              {resumenDias(diasRecoleccion)}
            </p>

            {/* Frecuencia y turno en la misma fila: son datos cortos y asi el
                paso 4 queda a la vista sin desplazar la barra lateral. */}
            <div className="cr-field-row">
              <label className="cr-field">
                <span className="cr-field-label">
                  Veces por semana
                  {frecuenciaSemanal == null && (
                    <span className="cr-field-falta" title="Sin definir" />
                  )}
                </span>
                <input
                  className={`cr-input${frecuenciaSemanal == null ? " cr-input--falta" : ""}`}
                  type="number"
                  min={1}
                  max={7}
                  placeholder="—"
                  value={frecuenciaSemanal ?? ""}
                  onChange={(e) => {
                    const valor = e.target.value;
                    // Al escribirla a mano deja de seguir al numero de dias.
                    setFrecuenciaManual(valor !== "");
                    setFrecuenciaSemanal(valor === "" ? null : Number(valor));
                  }}
                />
              </label>

              <label className="cr-field">
                <span className="cr-field-label">
                  Turno
                  {!turno && <span className="cr-field-falta" title="Sin definir" />}
                </span>
                <div className="cr-select-wrap">
                  <select
                    className={`cr-select${!turno ? " cr-select--falta" : ""}`}
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                  >
                    <option value="">Sin definir</option>
                    {TURNOS.map((t) => (
                      <option key={t.clave} value={t.clave}>
                        {t.etiqueta}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="cr-select-chevron" aria-hidden />
                </div>
              </label>
            </div>

            {frecuenciaSemanal != null &&
              diasRecoleccion.length > 0 &&
              frecuenciaSemanal !== diasRecoleccion.length && (
                <p className="cr-field-hint">
                  Marcaste {diasRecoleccion.length}{" "}
                  {diasRecoleccion.length === 1 ? "día" : "días"} pero la
                  frecuencia dice {frecuenciaSemanal}. Es válido si la ruta se
                  recorre más de una vez el mismo día.
                </p>
              )}

            {(diasRecoleccion.length === 0 || frecuenciaSemanal == null) && (
              <p className="cr-field-aviso">
                {diasRecoleccion.length === 0 && frecuenciaSemanal == null
                  ? "Sin días ni frecuencia"
                  : diasRecoleccion.length === 0
                    ? "Sin días"
                    : "Sin frecuencia"}
                , el ciudadano verá «Por definir» en su perfil. Puedes guardar
                igual y completarlo después.
              </p>
            )}

            <div className="cr-step">
              <span className="cr-step-num">4</span>
              <span className="cr-step-label">Marca los puntos en el mapa</span>
              <span className="cr-badge">
                {numPuntos} punto{numPuntos === 1 ? "" : "s"}
              </span>
            </div>

            <ol className="cr-points">
              {puntosRuta.map((p, i) => (
                <li
                  key={`${p.lat}-${p.lng}-${i}`}
                  className={`cr-point${i === 0 ? " cr-point--base" : ""}`}
                >
                  <span className="cr-point-num">{i === 0 ? "B" : i}</span>
                  <span className="cr-point-dir">{p.direccion}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="cr-actions">
            {errorRuta && <p className="crear-ruta-error">{errorRuta}</p>}
            {/* Previsualizar va arriba y guardar abajo: la accion final queda
                pegada al borde, donde termina el recorrido del formulario. */}
            <button
              type="button"
              className="cr-btn cr-btn-secondary"
              onClick={previsualizarRutaReal}
              disabled={ocupado || puntosRuta.length < 3}
              title="Dibuja el recorrido real por calles (no guarda nada ni requiere conductor)"
            >
              {previsualizando ? "Previsualizando…" : "Previsualizar ruta real"}
            </button>
            <button
              type="button"
              className="cr-btn cr-btn-primary"
              onClick={guardarRuta}
              disabled={ocupado}
            >
              {guardandoRuta
                ? "GUARDANDO…"
                : rutaEnEdicion
                  ? "GUARDAR CAMBIOS"
                  : "GUARDAR RUTA"}
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
