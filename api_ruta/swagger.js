const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Rutas Recolecta',
      version: '1.0.0',
      description: 'Microservicio dedicado exclusivamente a rutas y puntos de recoleccion.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
    tags: [
      { name: 'Rutas', description: 'Gestión de rutas de recolección' },
      { name: 'Puntos de recolección', description: 'Gestión de puntos de recolección de una ruta' },
      { name: 'Optimizar', description: 'Optimización de rutas mediante el servicio AG' },
      { name: 'Anomalías', description: 'Webhook para recibir anomalías creadas por otra API' },
    ],
    components: {
      schemas: {
        Ruta: {
          type: 'object',
          properties: {
            ruta_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Ruta Centro' },
            descripcion: { type: 'string', nullable: true, example: 'Recolección zona centro' },
            zona: { type: 'string', nullable: true, example: 'Centro' },
            json_ruta: { type: 'object', description: 'GeoJSON con la geometría y puntos de la ruta' },
            conductor_id: { type: 'integer', nullable: true, example: 5 },
            activa: { type: 'boolean', example: true },
            eliminado: { type: 'boolean', example: false },
            distancia_total: { type: 'number', nullable: true, example: 12.5 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        RutaInput: {
          type: 'object',
          required: ['nombre', 'json_ruta'],
          properties: {
            nombre: { type: 'string', example: 'Ruta Centro' },
            descripcion: { type: 'string', example: 'Recolección zona centro' },
            zona: { type: 'string', example: 'Centro' },
            json_ruta: { type: 'object', description: 'GeoJSON con la geometría y puntos de la ruta' },
            conductor_id: { type: 'integer', example: 5 },
          },
        },
        PuntoRecoleccion: {
          type: 'object',
          properties: {
            punto_id: { type: 'integer', example: 1 },
            ruta_id: { type: 'integer', example: 1 },
            orden: { type: 'integer', example: 1 },
            nombre: { type: 'string', nullable: true, example: 'Punto 1' },
            direccion: { type: 'string', nullable: true },
            lat: { type: 'number', example: 19.4326 },
            lon: { type: 'number', example: -99.1332 },
            calle: { type: 'string', nullable: true },
            colonia: { type: 'string', nullable: true },
            municipio: { type: 'string', nullable: true },
            estado: { type: 'string', nullable: true },
            cp: { type: 'string', nullable: true },
            es_inicio: { type: 'boolean', example: false },
            es_fin: { type: 'boolean', example: false },
            es_esquina: { type: 'boolean', example: false },
            eliminado: { type: 'boolean', example: false },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PuntoRecoleccionInput: {
          type: 'object',
          required: ['ruta_id', 'lat', 'lon'],
          properties: {
            ruta_id: { type: 'integer', example: 1 },
            orden: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Punto 1' },
            direccion: { type: 'string' },
            lat: { type: 'number', example: 19.4326 },
            lon: { type: 'number', example: -99.1332 },
            calle: { type: 'string' },
            colonia: { type: 'string' },
            municipio: { type: 'string' },
            estado: { type: 'string' },
            cp: { type: 'string' },
            es_inicio: { type: 'boolean' },
            es_fin: { type: 'boolean' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error inesperado' },
          },
        },
        Anomalia: {
          type: 'object',
          properties: {
            anomalia_id: { type: 'integer', example: 1 },
            id_anomalia: { type: 'string', example: 'AN-001' },
            lat: { type: 'number', example: 19.4326 },
            lng: { type: 'number', example: -99.1332 },
            texto: { type: 'string', nullable: true, example: 'Bache en la vía' },
            status: { type: 'string', nullable: true, example: 'pendiente' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        AnomaliaInput: {
          type: 'object',
          required: ['id_anomalia', 'lat', 'lng'],
          properties: {
            id_anomalia: { type: 'string', example: 'AN-001' },
            lat: { type: 'number', example: 19.4326 },
            lng: { type: 'number', example: -99.1332 },
            descripcion: { type: 'string', example: 'Bache en la vía' },
            status: { type: 'string', example: 'pendiente' },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
