const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { leerRutas, guardarRutas, siguienteId } = require('./db');
const { validarRutaPayload } = require('./validar');

const app = express();
const PUERTO = process.env.PORT || 8004;

app.use(cors());
app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api/rutas:
 *   get:
 *     summary: Lista todas las rutas guardadas
 *     tags: [Rutas]
 *     responses:
 *       200:
 *         description: Lista de rutas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RutasListResponse'
 */
app.get('/api/rutas', (req, res) => {
  const rutas = leerRutas();
  res.json({ success: true, data: rutas });
});

/**
 * @openapi
 * /api/rutas/{id}:
 *   get:
 *     summary: Obtiene una ruta por su id
 *     tags: [Rutas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ruta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RutaResponse'
 *       404:
 *         description: Ruta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/api/rutas/:id', (req, res) => {
  const rutas = leerRutas();
  const ruta = rutas.find((r) => r.ruta_id === Number(req.params.id));

  if (!ruta) {
    return res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
  }

  res.json({ success: true, data: ruta });
});

/**
 * @openapi
 * /api/rutas:
 *   post:
 *     summary: Crea una ruta nueva a partir de los puntos seleccionados en el mapa
 *     tags: [Rutas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RutaInput'
 *     responses:
 *       201:
 *         description: Ruta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RutaResponse'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post('/api/rutas', (req, res) => {
  const error = validarRutaPayload(req.body);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  const rutas = leerRutas();

  const nuevaRuta = {
    ruta_id: siguienteId(rutas),
    nombre: req.body.nombre.trim(),
    descripcion: req.body.descripcion?.trim() || '',
    json_ruta: JSON.stringify(req.body.puntos),
    created_at: new Date().toISOString(),
  };

  rutas.push(nuevaRuta);
  guardarRutas(rutas);

  res.status(201).json({ success: true, data: nuevaRuta });
});

/**
 * @openapi
 * /api/rutas/{id}:
 *   delete:
 *     summary: Elimina una ruta
 *     tags: [Rutas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ruta eliminada
 *       404:
 *         description: Ruta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.delete('/api/rutas/:id', (req, res) => {
  const rutas = leerRutas();
  const id = Number(req.params.id);
  const existe = rutas.some((r) => r.ruta_id === id);

  if (!existe) {
    return res.status(404).json({ success: false, error: 'Ruta no encontrada.' });
  }

  guardarRutas(rutas.filter((r) => r.ruta_id !== id));
  res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint no encontrado.' });
});

app.listen(PUERTO, () => {
  console.log(`api_ruta escuchando en http://localhost:${PUERTO}`);
  console.log(`Swagger disponible en http://localhost:${PUERTO}/api/docs`);
});
