/**
 * Implementación real contra el backend Spring Boot (Sección 5.1 de la especificación).
 * Mismas firmas que api.mock.js: la UI no cambia al conectar el servidor.
 */
import { http } from './http.js';

export const usuariosApi = {
  identificar: (correo) => http('/api/usuarios/identificacion', { method: 'POST', body: { correo } }),
};

export const catalogosApi = {
  obtener: (tipo) => http(`/api/catalogos/${tipo}`),
  async todos() {
    const [tiposObjeto, colores, etiquetas, modulos] = await Promise.all(
      ['tiposObjeto', 'colores', 'etiquetas', 'modulos'].map((t) => http(`/api/catalogos/${t}`)),
    );
    return { tiposObjeto, colores, etiquetas, modulos };
  },
};

function aFormData(datos) {
  const fd = new FormData();
  Object.entries(datos).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (k === 'fotografiaArchivo') fd.append('fotografia', v);
    else if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else if (k !== 'fotografiaUrl') fd.append(k, v);
  });
  return fd;
}

export const objetosApi = {
  listar: (filtros) => http('/api/objetos', { params: filtros }),
  obtener: (id) => http(`/api/objetos/${id}`),
  crear: (datos) => http('/api/objetos', { method: 'POST', formData: aFormData(datos) }),
  actualizar: (id, datos) => http(`/api/objetos/${id}`, { method: 'PUT', formData: aFormData(datos) }),
  eliminar: (id) => http(`/api/objetos/${id}`, { method: 'DELETE' }),
};

export const peticionesApi = {
  listar: ({ matricula } = {}) => http('/api/peticiones', { params: { matricula } }),
  obtener: (id) => http(`/api/peticiones/${id}`),
  crear: (datos) => http('/api/peticiones', { method: 'POST', body: datos }),
  contactoPrevio: (id) => http(`/api/peticiones/${id}/contacto-previo`),
  liberar: (id, datos) => http(`/api/peticiones/${id}/liberacion`, { method: 'PUT', body: datos }),
};
