const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'api_ruta',
      version: '1.0.0',
      description: 'API para guardar y consultar rutas dibujadas desde el Dashboard web. El campo json_ruta es consumido por la app móvil para trazar/optimizar la ruta.',
    },
    servers: [
      { url: 'http://localhost:8004', description: 'Local' },
    ],
    components: {
      schemas: {
        Punto: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            lat: { type: 'number', example: 16.6205 },
            lng: { type: 'number', example: -93.1042 },
            direccion: { type: 'string', example: 'Calle Primera Sur Oriente, Suchiapa' },
          },
        },
        RutaInput: {
          type: 'object',
          required: ['nombre', 'puntos'],
          properties: {
            nombre: { type: 'string', example: 'Ruta Norte Suchiapa' },
            descripcion: { type: 'string', example: 'Ruta creada desde el dashboard con 3 puntos.' },
            puntos: {
              type: 'array',
              minItems: 2,
              items: { $ref: '#/components/schemas/Punto' },
            },
          },
        },
        Ruta: {
          type: 'object',
          properties: {
            ruta_id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Ruta Norte Suchiapa' },
            descripcion: { type: 'string', example: 'Ruta creada desde el dashboard con 3 puntos.' },
            json_ruta: {
              type: 'string',
              description: 'String JSON con el arreglo de puntos [{lat, lng, direccion}]. La app móvil lo parsea para optimizar la ruta.',
              example: '[{"lat":16.6205,"lng":-93.1042,"direccion":"Calle X"}]',
            },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        RutaResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/Ruta' },
          },
        },
        RutasListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Ruta' },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'El campo "nombre" es obligatorio.' },
          },
        },
      },
    },
  },
  apis: ['./server.js'],
};

module.exports = swaggerJsdoc(options);
