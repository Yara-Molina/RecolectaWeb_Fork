function validarPunto(punto) {
  if (typeof punto !== 'object' || punto === null) return 'Cada punto debe ser un objeto.';
  if (typeof punto.lat !== 'number' || Number.isNaN(punto.lat)) return 'Cada punto necesita "lat" numérico.';
  if (typeof punto.lng !== 'number' || Number.isNaN(punto.lng)) return 'Cada punto necesita "lng" numérico.';
  if (punto.direccion !== undefined && typeof punto.direccion !== 'string') {
    return 'El campo "direccion" debe ser texto si se envía.';
  }
  return null;
}

function validarRutaPayload(body) {
  if (typeof body !== 'object' || body === null) {
    return 'El cuerpo de la petición debe ser un objeto JSON.';
  }

  if (typeof body.nombre !== 'string' || !body.nombre.trim()) {
    return 'El campo "nombre" es obligatorio.';
  }

  if (body.descripcion !== undefined && typeof body.descripcion !== 'string') {
    return 'El campo "descripcion" debe ser texto si se envía.';
  }

  if (!Array.isArray(body.puntos) || body.puntos.length < 2) {
    return 'El campo "puntos" debe ser un arreglo con al menos 2 puntos.';
  }

  for (const punto of body.puntos) {
    const error = validarPunto(punto);
    if (error) return error;
  }

  return null;
}

module.exports = { validarRutaPayload };
