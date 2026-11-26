/**
 * Cliente HTTP mínimo para la API REST (Spring Boot).
 * - Envía el token JWT (Authorization: Bearer) que entrega POST /api/usuarios/identificacion.
 * - Normaliza los errores de la API ({ status, error, mensaje, campos }) en ApiError, con un
 *   código de negocio estable para que la UI no dependa del texto ni del transporte.
 */

export class ApiError extends Error {
  /**
   * @param {number} status  Código HTTP (0 = sin conexión)
   * @param {string} code    Código de negocio (p. ej. 'PETICION_DUPLICADA')
   * @param {string} message Mensaje listo para mostrarse
   * @param {Record<string, string>} [campos] Errores por campo (validación del formulario)
   */
  constructor(status, code, message, campos) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.campos = campos ?? null;
  }
}

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Convierte una ruta de la API (/uploads/objetos/x.jpg) en URL absoluta para <img src>. */
export const urlRecurso = (ruta) => (!ruta ? null : /^(https?:|data:|blob:)/.test(ruta) ? ruta : `${API_URL}${ruta}`);

/* ---------------- Token ---------------- */

const TOKEN_KEY = 'univa-op:token';

export const token = {
  leer: () => sessionStorage.getItem(TOKEN_KEY),
  guardar: (t) => (t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY)),
  borrar: () => sessionStorage.removeItem(TOKEN_KEY),
};

/** Evento que escucha SessionProvider para cerrar la sesión cuando el token vence (401). */
export const EVENTO_SESION_EXPIRADA = 'univa-op:sesion-expirada';

/* ---------------- Errores ---------------- */

// Mensajes de la API (exception/Mensajes.java) → código que usa la UI.
const CODIGOS = [
  ['No encontramos una cuenta con ese correo', 'NO_ENCONTRADO'],
  ['no tiene un rol asignado', 'SIN_ROL'],
  ['Ya tienes una petición pendiente', 'PETICION_DUPLICADA'],
  ['cambió de estado', 'OBJETO_CAMBIO_ESTADO'],
  ['ya fue liberada', 'PETICION_LIBERADA'],
  ['entregado a ti', 'RECLAMO_PROPIO'],
  ['solo están disponibles en los reclamos de error', 'NO_APLICA'],
];

const CODIGO_POR_STATUS = {400: 'VALIDACION', 401: 'NO_AUTENTICADO', 403: 'SIN_PERMISO', 404: 'NO_ENCONTRADO', 409: 'CONFLICTO', 413: 'IMAGEN_GRANDE'};

function codigoDe(status, mensaje = '') {
  const encontrado = CODIGOS.find(([texto]) => mensaje.includes(texto));
  return encontrado ? encontrado[1] : (CODIGO_POR_STATUS[status] ?? 'ERROR');
}

/* ---------------- Peticiones HTTP ---------------- */

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

/**
 * @param {string} path Ruta de la API (p. ej. '/api/objetos')
 * @param {object} [opciones]
 * @param {boolean} [opciones.publico] true = no envía el token y un 401 no cierra la sesión
 */
export async function http(path, { method = 'GET', params, body, formData, publico = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (!formData) headers['Content-Type'] = 'application/json'; // con FormData el navegador arma el boundary
  const jwt = token.leer();
  if (jwt && !publico) headers.Authorization = `Bearer ${jwt}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(params)}`, {
      method,
      headers,
      body: formData ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No pudimos conectar con el servidor. Inténtalo de nuevo en unos momentos.');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const mensaje = data?.mensaje ?? data?.message ?? 'Ocurrió un error inesperado.';
    if (res.status === 401 && !publico) {
      token.borrar();
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA, { detail: mensaje }));
    }
    throw new ApiError(res.status, codigoDe(res.status, mensaje), mensaje, data?.campos);
  }
  return data;
}
