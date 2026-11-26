/**
 * Reglas de validación de la especificación (formularios F-01 a F-05).
 * Cada función devuelve un mensaje de error o cadena vacía.
 */

export function validarCorreo(valor) {
  const v = valor.trim();
  if (!v) return 'Ingresa tu correo para continuar.';
  if (v.length > 100 || /\s/.test(v) || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return 'Escribe un correo con formato válido.';
  }
  return '';
}

export function validarMatricula(valor) {
  const v = valor.trim();
  if (!v) return '';
  if (!/^[a-zA-Z0-9]{1,15}$/.test(v)) return 'Escribe una matrícula válida (solo letras y números).';
  return '';
}

const SOLO_ALFANUM = /^[\p{L}\p{N}]+(?: [\p{L}\p{N}]+)*$/u;

export const reglasObjeto = {
  fotografia: (v) => (v ? '' : 'Agrega una fotografía del objeto.'),
  nombre: (v) => {
    if (!v) return 'Escribe el nombre del objeto.';
    if (v !== v.trim()) return 'Quita los espacios al inicio o al final.';
    if (v.length < 3 || v.length > 60) return 'Usa entre 3 y 60 caracteres.';
    if (!SOLO_ALFANUM.test(v)) return 'Usa solo letras, números y espacios.';
    return '';
  },
  descripcion: (v) => {
    const t = v.trim();
    if (!t) return 'Describe el objeto para que su dueño lo reconozca.';
    if (/<[^>]*>|[<>{}]/.test(t)) return 'La descripción no puede incluir etiquetas ni código.';
    if (t.length < 10) return `Faltan ${10 - t.length} caracteres (mínimo 10).`;
    if (t.length > 250) return 'Máximo 250 caracteres.';
    return '';
  },
  marca: (v) => (v.trim().length > 40 ? 'Máximo 40 caracteres.' : ''),
  tipoObjetoId: (v) => (v ? '' : 'Selecciona el tipo de objeto.'),
  colorId: (v) => (v ? '' : 'Selecciona el color.'),
  lugarPerdida: (v) => {
    const t = v.trim();
    if (!t) return 'Indica dónde se encontró el objeto.';
    if (t.length < 3 || t.length > 80) return 'Usa entre 3 y 80 caracteres.';
    return '';
  },
  moduloId: (v) => (v ? '' : 'Selecciona el módulo de resguardo.'),
};

export const IMAGEN_MAX_MB = 5;

export function validarImagen(file) {
  if (!file) return 'Agrega una fotografía del objeto.';
  const tipoOk = ['image/jpeg', 'image/png'].includes(file.type);
  if (!tipoOk || file.size > IMAGEN_MAX_MB * 1024 * 1024) {
    return 'Formato o tamaño no permitido. Usa una imagen JPG o PNG de máximo 5 MB.';
  }
  return '';
}
