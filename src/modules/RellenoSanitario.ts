// Modelo tal como lo devuelve la API (GET /api/relleno-sanitario/)
export interface RellenoSanitario {
  relleno_id: number;
  nombre: string;
  direccion: string;
  es_rentado: boolean;
  eliminado: boolean;
  capacidad_toneladas: number;
}

// Body para POST /api/relleno-sanitario/ y PUT /api/relleno-sanitario/:id
export interface RellenoSanitarioPayload {
  nombre: string;
  direccion: string;
  es_rentado: boolean;
  capacidad_toneladas: number;
}