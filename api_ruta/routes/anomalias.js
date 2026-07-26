const express = require('express');
const axios = require('axios');

const router = express.Router();

const WEBSOCKET_API_URL = process.env.WEBSOCKET_API_URL || 'http://127.0.0.1:8005';
//agregue pero los voy a cambair cuando yr ponga conductor_id
const CONDUCTORES_IDS = [1, 2, 3];
const CAMIONES_IDS = [1, 2];

/**
 * @swagger
 * /anomalia_creada:
 *   post:
 *     summary: Webhook para registrar una anomalía creada por otra API
 *     tags: [Anomalías]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AnomaliaInput' }
 *     responses:
 *       201:
 *         description: Anomalía recibida
 *       400:
 *         description: Datos inválidos
 */
router.post('/', async (req, res) => {
  const { id_anomalia, lat, lng, descripcion, status} = req.body;

  if (!id_anomalia || lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'id_anomalia, lat y lng son requeridos',
    });
  }

  const anomalia = {
    id_anomalia,
    lat,
    lng,
    descripcion: descripcion || null,
    status: status || 'aprobado',
  };

  console.log('POST /anomalia_creada - Recibido:', anomalia);

  const notificacion = {
    ...anomalia,
    texto: anomalia.descripcion,
    conductores_ids: CONDUCTORES_IDS,
    camiones_ids: CAMIONES_IDS,
  };

  try {
    await axios.post(`${WEBSOCKET_API_URL}/notificar_recalculo_ruta`, notificacion, {
      timeout: 5000,
    });
    console.log('Notificación enviada al websocket exitosamente');
  } catch (error) {
    console.error('Error al notificar al websocket:', error.message);
  }

  res.status(201).json({
    success: true,
    data: anomalia,
  });
});

module.exports = router;
