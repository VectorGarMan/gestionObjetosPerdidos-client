/**
 * Punto único de acceso a datos.
 * - Sin VITE_API_URL → modo demostración (api.mock.js, datos en localStorage).
 * - Con VITE_API_URL → backend real (api.http.js).
 */
import * as mock from './api.mock.js';
import * as real from './api.http.js';
import { API_URL } from './http.js';

export const MODO_DEMO = !API_URL;

const impl = MODO_DEMO ? mock : real;

export const { usuariosApi, catalogosApi, objetosApi, peticionesApi } = impl;
export { ApiError } from './http.js';
export { restablecerDb } from './mockDb.js';
