/**
 * Base de datos simulada sobre localStorage.
 * Persiste los cambios entre recargas para que el prototipo se pueda probar de punta a punta.
 */
import { objetos, peticiones, usuarios } from '../data/seed.js';

const KEY = 'univa-op:db:v1';

function semilla() {
  return structuredClone({ objetos, peticiones, usuarios });
}

let cache = null;

export function leerDb() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : semilla();
  } catch {
    cache = semilla();
  }
  return cache;
}

export function guardarDb(db) {
  cache = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Cuota llena (fotografías grandes): se mantiene en memoria durante la sesión.
  }
}

export function restablecerDb() {
  cache = semilla();
  localStorage.removeItem(KEY);
}

export function siguienteId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/** Latencia de red simulada para que los estados de carga sean visibles y realistas. */
export function latencia(min = 220, max = 520) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}
