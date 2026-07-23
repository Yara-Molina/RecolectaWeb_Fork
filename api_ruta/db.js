const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'rutas.json');

function leerRutas() {
  if (!fs.existsSync(DB_FILE)) return [];
  const contenido = fs.readFileSync(DB_FILE, 'utf-8').trim();
  if (!contenido) return [];
  return JSON.parse(contenido);
}

function guardarRutas(rutas) {
  fs.writeFileSync(DB_FILE, JSON.stringify(rutas, null, 2), 'utf-8');
}

function siguienteId(rutas) {
  return rutas.reduce((max, r) => Math.max(max, r.ruta_id), 0) + 1;
}

module.exports = { leerRutas, guardarRutas, siguienteId };
