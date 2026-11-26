/**
 * Cliente HTTP mínimo para la API REST (Spring Boot).
 * Normaliza los errores en ApiError para que la UI no dependa del transporte.
 */

export class ApiError extends Error {
  /**
   * @param {number} status  Código HTTP (0 = sin conexión)
   * @param {string} code    Código de negocio (p. ej. 'PETICION_DUPLICADA')
   * @param {string} message Mensaje listo para mostrarse
   */
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length) qs.set(k, v.join(','));
    } else {
      qs.set(k, String(v));
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function http(path, { method = 'GET', params, body, formData } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(params)}`, {
      method,
      headers: formData ? undefined : { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: formData ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No pudimos conectar con el servidor. Inténtalo de nuevo en unos momentos.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? 'ERROR', data?.message ?? 'Ocurrió un error inesperado.');
  }
  return data;
}
