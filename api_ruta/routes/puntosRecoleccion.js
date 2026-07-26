const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

/**
 * @swagger
 * /puntos-recoleccion:
 *   get:
 *     summary: Obtener todos los puntos de recolección
 *     tags: [Puntos de recolección]
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM puntos_recoleccion WHERE eliminado = FALSE ORDER BY punto_id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /puntos-recoleccion/ruta/{rutaId}:
 *   get:
 *     summary: Obtener los puntos de recolección de una ruta
 *     tags: [Puntos de recolección]
 */
router.get('/ruta/:rutaId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM puntos_recoleccion
       WHERE ruta_id = ? AND eliminado = FALSE
       ORDER BY orden ASC`,
      [req.params.rutaId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /puntos-recoleccion/{id}:
 *   get:
 *     summary: Obtener un punto de recolección por ID
 *     tags: [Puntos de recolección]
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM puntos_recoleccion WHERE punto_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Punto no encontrado' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /puntos-recoleccion:
 *   post:
 *     summary: Crear un nuevo punto de recolección
 *     tags: [Puntos de recolección]
 */
router.post('/', async (req, res) => {
  const { ruta_id, orden, nombre, direccion, lat, lon, calle, colonia, municipio, estado, cp, es_inicio, es_fin } = req.body;
  console.log('POST /puntos-recoleccion - Recibido:', { ruta_id, orden, nombre, direccion, lat, lon, calle, colonia, municipio, estado, cp, es_inicio, es_fin });
  if (!ruta_id || lat === undefined || lon === undefined) {
    return res.status(400).json({
      success: false,
      message: 'ruta_id, lat y lon son requeridos',
    });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO puntos_recoleccion (ruta_id, orden, nombre, direccion, lat, lon, calle, colonia, municipio, estado, cp, es_inicio, es_fin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ruta_id,
        orden || 0,
        nombre || null,
        direccion || null,
        lat,
        lon,
        calle || null,
        colonia || null,
        municipio || null,
        estado || null,
        cp || null,
        es_inicio || false,
        es_fin || false
      ]
    );
    const [rows] = await pool.query(
      'SELECT * FROM puntos_recoleccion WHERE punto_id = ?',
      [result.insertId]
    );
    console.log('POST /puntos-recoleccion - Punto creado:', rows[0]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('POST /puntos-recoleccion - Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /puntos-recoleccion/{id}:
 *   put:
 *     summary: Actualizar un punto de recolección
 *     tags: [Puntos de recolección]
 */
router.put('/:id', async (req, res) => {
  const { orden, nombre, lat, lon, cp } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM puntos_recoleccion WHERE punto_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Punto no encontrado' });
    }
    const current = existing[0];
    await pool.query(
      `UPDATE puntos_recoleccion SET orden = ?, nombre = ?, lat = ?, lon = ?, cp = ?
       WHERE punto_id = ?`,
      [
        orden ?? current.orden,
        nombre ?? current.nombre,
        lat ?? current.lat,
        lon ?? current.lon,
        cp ?? current.cp,
        req.params.id,
      ]
    );
    const [rows] = await pool.query(
      'SELECT * FROM puntos_recoleccion WHERE punto_id = ?',
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /puntos-recoleccion/{id}:
 *   delete:
 *     summary: Eliminar un punto de recolección (soft delete)
 *     tags: [Puntos de recolección]
 */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE puntos_recoleccion SET eliminado = TRUE WHERE punto_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Punto no encontrado' });
    }
    res.json({ success: true, message: 'Punto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
