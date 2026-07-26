const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

/**
 * @swagger
 * /rutas:
 *   get:
 *     summary: Obtener todas las rutas
 *     tags: [Rutas]
 *     responses:
 *       200:
 *         description: Lista de rutas con sus puntos de recolección
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM rutas WHERE eliminado = FALSE ORDER BY ruta_id DESC'
    );

    const rutasConPuntos = await Promise.all(rows.map(async (ruta) => {
      const [puntos] = await pool.query(
        `SELECT * FROM puntos_recoleccion
         WHERE ruta_id = ? AND eliminado = FALSE AND es_esquina = FALSE
         ORDER BY orden ASC`,
        [ruta.ruta_id]
      );

      let jsonRuta = ruta.json_ruta;
      if (typeof jsonRuta === 'string') {
        try { jsonRuta = JSON.parse(jsonRuta); } catch (e) { jsonRuta = {}; }
      }

      if (puntos.length > 0) {
        jsonRuta.puntos = puntos.map((p, index) => ({
          id: p.punto_id,
          orden: p.orden || index + 1,
          nombre: p.nombre || `Punto ${index + 1}`,
          lat: p.lat,
          lng: p.lon,
          direccion: p.direccion,
          calle: p.calle,
          colonia: p.colonia,
          municipio: p.municipio,
          estado: p.estado,
          cp: p.cp,
          es_inicio: Boolean(p.es_inicio),
          es_fin: Boolean(p.es_fin),
        }));
      }

      return { ...ruta, json_ruta: jsonRuta };
    }));

    console.log(`GET /rutas - Devolviendo ${rutasConPuntos.length} rutas`);
    res.json({ success: true, data: rutasConPuntos });
  } catch (err) {
    console.error('GET /rutas - Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /rutas/activas:
 *   get:
 *     summary: Obtener rutas activas
 *     tags: [Rutas]
 */
router.get('/activas', async (req, res) => {
  try {
    const conductorId = req.query.conductor_id;

    let query = 'SELECT * FROM rutas WHERE activa = TRUE AND eliminado = FALSE';
    const params = [];

    if (conductorId) {
      query += ' AND conductor_id = ?';
      params.push(conductorId);
    }

    query += ' ORDER BY ruta_id DESC';

    const [rows] = await pool.query(query, params);

    const rutasConPuntos = await Promise.all(rows.map(async (ruta) => {
      const [puntos] = await pool.query(
        `SELECT * FROM puntos_recoleccion
         WHERE ruta_id = ? AND eliminado = FALSE AND es_esquina = FALSE
         ORDER BY orden ASC`,
        [ruta.ruta_id]
      );

      let jsonRuta = ruta.json_ruta;
      if (typeof jsonRuta === 'string') {
        try { jsonRuta = JSON.parse(jsonRuta); } catch (e) { jsonRuta = {}; }
      }

      if (puntos.length > 0) {
        jsonRuta.puntos = puntos.map((p, index) => ({
          id: p.punto_id,
          orden: p.orden || index + 1,
          nombre: p.nombre || `Punto ${index + 1}`,
          lat: p.lat,
          lng: p.lon,
          direccion: p.direccion,
          calle: p.calle,
          colonia: p.colonia,
          municipio: p.municipio,
          estado: p.estado,
          cp: p.cp,
          es_inicio: Boolean(p.es_inicio),
          es_fin: Boolean(p.es_fin),
        }));
      }

      return { ...ruta, json_ruta: jsonRuta };
    }));

    console.log(`GET /rutas/activas - Devolviendo ${rutasConPuntos.length} rutas${conductorId ? ` para conductor ${conductorId}` : ''}`);
    res.json({ success: true, data: rutasConPuntos });
  } catch (err) {
    console.error('GET /rutas/activas - Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /rutas/{id}:
 *   get:
 *     summary: Obtener una ruta por ID
 *     tags: [Rutas]
 */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM rutas WHERE ruta_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /rutas:
 *   post:
 *     summary: Crear una nueva ruta
 *     tags: [Rutas]
 */
router.post('/', async (req, res) => {
  const { nombre, descripcion, zona, json_ruta, conductor_id } = req.body;
  console.log('POST /rutas - Recibido:', { nombre, descripcion, zona, conductor_id, json_ruta });
  if (!nombre || !json_ruta) {
    return res.status(400).json({
      success: false,
      message: 'nombre y json_ruta son requeridos',
    });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO rutas (nombre, descripcion, zona, json_ruta, conductor_id) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion || null, zona || null, JSON.stringify(json_ruta), conductor_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM rutas WHERE ruta_id = ?', [result.insertId]);
    console.log('POST /rutas - Ruta creada:', rows[0]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('POST /rutas - Error:', err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /rutas/{id}:
 *   put:
 *     summary: Actualizar una ruta
 *     tags: [Rutas]
 */
router.put('/:id', async (req, res) => {
  const { nombre, descripcion, zona, json_ruta, activa } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM rutas WHERE ruta_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    }
    const current = existing[0];
    await pool.query(
      `UPDATE rutas SET nombre = ?, descripcion = ?, zona = ?, json_ruta = ?, activa = ?
       WHERE ruta_id = ?`,
      [
        nombre ?? current.nombre,
        descripcion ?? current.descripcion,
        zona ?? current.zona,
        json_ruta ? JSON.stringify(json_ruta) : current.json_ruta,
        activa ?? current.activa,
        req.params.id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM rutas WHERE ruta_id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /rutas/{id}:
 *   delete:
 *     summary: Eliminar una ruta (soft delete)
 *     tags: [Rutas]
 */
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE rutas SET eliminado = TRUE WHERE ruta_id = ? AND eliminado = FALSE',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    }
    res.json({ success: true, message: 'Ruta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
