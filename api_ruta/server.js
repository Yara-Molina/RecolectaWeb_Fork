const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./swagger');
const rutasRouter = require('./routes/rutas');
const puntosRouter = require('./routes/puntosRecoleccion');
const optimizarRouter = require('./routes/optimizar');
const anomaliasRouter = require('./routes/anomalias');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/rutas', rutasRouter);
app.use('/puntos-recoleccion', puntosRouter);
app.use('/optimizar', optimizarRouter);
app.use('/anomalia_creada', anomaliasRouter);

app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

const PORT = process.env.PORT || 8004;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`api_ruta escuchando en http://0.0.0.0:${PORT}`);
  console.log(`Accesible desde red local en http://192.168.100.23:${PORT}`);
  console.log(`Swagger disponible en http://127.0.0.1:${PORT}/api-docs`);
});
