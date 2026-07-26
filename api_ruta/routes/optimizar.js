const express = require('express');
const axios = require('axios');
const pool = require('../db/pool');

const router = express.Router();

const AG_API_URL = process.env.AG_API_URL || 'http://127.0.0.1:8003';

/**
 * @swagger
 * /optimizar/ruta/{rutaId}:
 *   post:
 *     summary: Optimizar una ruta usando el servicio de algoritmo genético (AG)
 *     tags: [Optimizar]
 */
router.post('/ruta/:rutaId', async (req, res) => {
  const { rutaId } = req.params;

  try {
    const [rutaRows] = await pool.query(
      'SELECT * FROM rutas WHERE ruta_id = ? AND eliminado = FALSE',
      [rutaId]
    );

    if (rutaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    }

    const ruta = rutaRows[0];

    const [puntosRows] = await pool.query(
      `SELECT * FROM puntos_recoleccion
       WHERE ruta_id = ? AND eliminado = FALSE
       ORDER BY orden ASC`,
      [rutaId]
    );

    if (puntosRows.length === 0) {
      return res.status(400).json({ success: false, message: 'La ruta no tiene puntos de recolección' });
    }

    const puntoInicio = puntosRows.find(p => p.es_inicio) || puntosRows[0];
    const puntoFin = puntosRows.find(p => p.es_fin) || puntosRows[puntosRows.length - 1];

    const puntosIntermedios = puntosRows.filter(
      p => p.punto_id !== puntoInicio.punto_id && p.punto_id !== puntoFin.punto_id
    );

    const puntosParaAG = puntosIntermedios.map(p => ({
      id: String(p.punto_id),
      lat: p.lat,
      lng: p.lon,
      nombre: p.nombre || `Punto ${p.punto_id}`,
    }));

    const baseInicio = { lat: puntoInicio.lat, lng: puntoInicio.lon, nombre: puntoInicio.nombre || 'Base Inicio' };
    const baseFin = { lat: puntoFin.lat, lng: puntoFin.lon, nombre: puntoFin.nombre || 'Base Fin' };

    console.log(`Enviando al AG: ${puntosParaAG.length} puntos intermedios + base inicio + base fin`);

    if (puntosParaAG.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La ruta necesita al menos un punto intermedio además de las bases para optimizar',
      });
    }

    let rutaOptimizada;
    try {
      const agResponse = await axios.post(`${AG_API_URL}/optimizar`, {
        puntos: puntosParaAG,
        base_inicio: baseInicio,
        base_fin: baseFin,
        bloqueos: [],
        radio_bloqueo: 25.0,
      }, { timeout: 60000 });

      rutaOptimizada = agResponse.data;
      console.log('Ruta optimizada recibida del AG');
    } catch (agError) {
      console.error('Error al llamar al AG:', agError.message);
      return res.status(500).json({
        success: false,
        message: 'El servicio de optimización no está disponible',
        error: agError.message,
        ruta_original: { ruta_id: ruta.ruta_id, nombre: ruta.nombre, puntos: puntosParaAG },
      });
    }

    let jsonRutaActual = ruta.json_ruta;
    if (typeof jsonRutaActual === 'string') {
      try { jsonRutaActual = JSON.parse(jsonRutaActual); } catch (e) { jsonRutaActual = {}; }
    }

    const coordsOptimizadas = Array.isArray(rutaOptimizada.todas_las_coords)
      ? rutaOptimizada.todas_las_coords : [];

    await pool.query('DELETE FROM puntos_recoleccion WHERE ruta_id = ? AND es_esquina = TRUE', [rutaId]);

    const segmentosOrden = Array.isArray(rutaOptimizada.segmentos) ? rutaOptimizada.segmentos : [];
    const secuenciaPuntoIds = [];
    if (segmentosOrden.length > 0) {
      const primerMatch = segmentosOrden[0].de?.match(/^(\d+)\s*-/);
      if (primerMatch) secuenciaPuntoIds.push(Number(primerMatch[1]));
      for (const seg of segmentosOrden) {
        const match = seg.a?.match(/^(\d+)\s*-/);
        if (match) secuenciaPuntoIds.push(Number(match[1]));
      }
    }

    if (secuenciaPuntoIds.length > 0) {
      let ordenReal = 1;
      await pool.query('UPDATE puntos_recoleccion SET orden = ? WHERE punto_id = ?', [ordenReal++, puntoInicio.punto_id]);
      for (const pid of secuenciaPuntoIds) {
        await pool.query('UPDATE puntos_recoleccion SET orden = ? WHERE punto_id = ?', [ordenReal++, pid]);
      }
      await pool.query('UPDATE puntos_recoleccion SET orden = ? WHERE punto_id = ?', [ordenReal++, puntoFin.punto_id]);
      console.log(`Reordenados ${secuenciaPuntoIds.length + 2} puntos según la secuencia real del AG`);
    }

    const puntosPaso = [];
    const segmentos = Array.isArray(rutaOptimizada.segmentos) ? rutaOptimizada.segmentos : [];
    let ordenPaso = puntosRows.length;
    for (const segmento of segmentos) {
      const pasos = Array.isArray(segmento.pasos) ? segmento.pasos : [];
      for (const paso of pasos) {
        const coordInicio = paso.coord_inicio;
        const lat = Array.isArray(coordInicio) ? coordInicio[0] : coordInicio?.lat;
        const lng = Array.isArray(coordInicio) ? coordInicio[1] : coordInicio?.lng;
        if (lat == null || lng == null) continue;

        ordenPaso += 1;
        puntosPaso.push([
          rutaId, ordenPaso, paso.calle || 'Sin nombre', paso.calle || 'Sin nombre',
          lat, lng, paso.distancia_m ?? null, paso.instruccion || null, true,
        ]);
      }
    }

    if (puntosPaso.length > 0) {
      await pool.query(
        `INSERT INTO puntos_recoleccion
           (ruta_id, orden, nombre, calle, lat, lon, distancia_segmento, instruccion, es_esquina)
         VALUES ?`,
        [puntosPaso]
      );
      console.log(`Guardados ${puntosPaso.length} pasos de navegación del AG para ruta ${rutaId}`);
    }

    const geojson = {
      type: 'LineString',
      coordinates: coordsOptimizadas.map(c => {
        if (Array.isArray(c)) return [c[1], c[0]];
        return [c.lng, c.lat];
      }),
      puntos: jsonRutaActual.puntos || [],
      base_inicio: baseInicio,
      base_fin: baseFin,
      optimizada: true,
      distancia_total_km: rutaOptimizada.distancia_total_km || null,
      ruta_optimizada_coords: coordsOptimizadas,
    };

    await pool.query(
      'UPDATE rutas SET json_ruta = ?, distancia_total = ? WHERE ruta_id = ?',
      [JSON.stringify(geojson), rutaOptimizada.distancia_total_km || null, rutaId]
    );

    console.log(`Ruta ${rutaId} optimizada: ${rutaOptimizada.distancia_total_km} km, ${coordsOptimizadas.length} coords`);

    const [puntosActualizados] = await pool.query(
      `SELECT * FROM puntos_recoleccion WHERE ruta_id = ? AND eliminado = FALSE ORDER BY orden ASC`,
      [rutaId]
    );

    res.json({
      success: true,
      message: 'Ruta optimizada exitosamente',
      data: {
        ruta_id: ruta.ruta_id,
        nombre: ruta.nombre,
        distancia_total_km: rutaOptimizada.distancia_total_km || null,
        distancia_total_m: rutaOptimizada.distancia_total_m || null,
        puntos: puntosActualizados,
        segmentos: rutaOptimizada.segmentos || [],
        coordenadas: coordsOptimizadas,
      },
    });

  } catch (error) {
    console.error('Error al optimizar ruta:', error);
    res.status(500).json({ success: false, message: 'Error al optimizar la ruta', error: error.message });
  }
});

/**
 * @swagger
 * /optimizar/status:
 *   get:
 *     summary: Verificar disponibilidad del servicio AG
 *     tags: [Optimizar]
 */
router.get('/status', async (req, res) => {
  try {
    const agResponse = await axios.get(`${AG_API_URL}/health`, { timeout: 5000 });
    res.json({ success: true, message: 'Servicio AG disponible', ag_status: agResponse.data });
  } catch (error) {
    res.status(503).json({ success: false, message: 'Servicio AG no disponible', error: error.message });
  }
});

module.exports = router;
