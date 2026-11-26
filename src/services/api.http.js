/**
 * Implementación real contra la API Spring Boot (gestionObjetosPerdidos-api, sección 5.1).
 * Mismas firmas y forma de datos que api.mock.js: la UI no cambia al conectar el servidor.
 *
 * La API devuelve objetos anidados (tipoObjeto, color, modulo, otrasEtiquetas, rutaImagen…);
 * aquí se traducen a la forma plana que usa la UI (tipoObjetoId, colorId, moduloId,
 * otrasEtiquetaIds, fotografiaUrl…). Lo que la API no envía (folio, filtros por texto y por
 * módulo, peticiones del propio estudiante) se resuelve en el cliente, como se indica en cada caso.
 */
import { http, token, urlRecurso } from './http.js';
import { normalizar } from '../utils/format.js';

/* ---------------- Sesión ---------------- */

function usuarioActual() {
  try {
    return JSON.parse(sessionStorage.getItem('univa-op:sesion') || 'null');
  } catch {
    return null;
  }
}
const esAdmin = () => usuarioActual()?.rol === 'ADMINISTRADOR';

/* ---------------- Adaptadores API → UI ---------------- */

// La API no tiene folio: se deriva del id con el mismo formato del modo demostración.
const folioObjeto = (id) => `OP-${String(100 + id).padStart(4, '0')}`;
const folioPeticion = (id) => `PT-${String(200 + id).padStart(4, '0')}`;

/** UsuarioDTO → usuario de la sesión. Los administradores no tienen matrícula en la base. */
function aUsuario(u) {
  return { id: u.id, nombre: u.nombre, correo: u.correo, matricula: u.matricula ?? '—', rol: u.rol, programa: null };
}

/** PersonaDTO → resumen de persona que usa la UI. */
function aPersona(p) {
  return p ? { nombre: p.nombre, matricula: p.matricula ?? '—', correo: p.correo, programa: null } : null;
}

/** ObjetoDTO → objeto plano de la UI. */
function aObjeto(o) {
  return {
    id: o.id,
    folio: folioObjeto(o.id),
    nombre: o.nombre,
    descripcion: o.descripcion,
    marca: o.marca ?? '',
    lugarPerdida: o.lugarPerdida,
    estado: o.estado,
    tipoObjetoId: o.tipoObjeto?.id ?? null,
    colorId: o.color?.id ?? null,
    moduloId: o.modulo?.id ?? null,
    otrasEtiquetaIds: (o.otrasEtiquetas ?? []).map((e) => e.id),
    fotografiaUrl: urlRecurso(o.rutaImagen),
    fechaRegistro: o.fechaRegistro,
    fechaReclamo: o.fechaReclamo,
    reclamadoPor: null, // la API no lo expone (privacidad, F-03)
  };
}

/** Resumen del objeto que va dentro de una petición. */
function resumenObjeto(o) {
  if (!o) return null;
  const { id, folio, nombre, estado, tipoObjetoId, colorId, moduloId, fotografiaUrl, lugarPerdida, fechaRegistro, fechaReclamo } = aObjeto(o);
  return { id, folio, nombre, estado, tipoObjetoId, colorId, moduloId, fotografiaUrl, lugarPerdida, fechaRegistro, fechaReclamo };
}

/** PeticionDetalleDTO → petición expandida de la UI. */
function aPeticion(p) {
  return {
    id: p.id,
    folio: folioPeticion(p.id),
    tipo: p.tipo,
    estado: p.estado,
    objetoId: p.objeto?.id ?? null,
    matricula: p.solicitante?.matricula ?? '—',
    fechaCreacion: p.fechaRegistro,
    fechaLiberacion: p.fechaLiberacion,
    liberadaPor: p.liberadaPor?.nombre ?? null,
    solicitante: aPersona(p.solicitante),
    objeto: resumenObjeto(p.objeto),
  };
}

/** PeticionDTO (fila de lista o respuesta al crear) → petición de la UI, con el objeto si se conoce. */
function aPeticionResumen(p, objeto = null) {
  return {
    id: p.id,
    folio: folioPeticion(p.id),
    tipo: p.tipo,
    estado: p.estado,
    objetoId: p.objetoId,
    matricula: p.matricula,
    fechaCreacion: p.fechaRegistro,
    fechaLiberacion: p.fechaLiberacion,
    liberadaPor: null,
    solicitante: { nombre: p.solicitanteNombre, matricula: p.matricula, correo: null, programa: null },
    objeto: objeto ?? { id: p.objetoId, folio: folioObjeto(p.objetoId), nombre: p.objetoNombre },
  };
}

/* ---------------- Usuarios ---------------- */

export const usuariosApi = {
  /** POST /api/usuarios/identificacion → guarda el token JWT para las demás llamadas. */
  async identificar(correo) {
    const r = await http('/api/usuarios/identificacion', { method: 'POST', body: { correo }, publico: true });
    token.guardar(r.token);
    return aUsuario(r.usuario);
  },
};

/* ---------------- Catálogos ---------------- */

// Rutas de la API para cada catálogo que usa la UI.
const RUTAS_CATALOGO = { tiposObjeto: 'tipos-objeto', colores: 'colores', etiquetas: 'etiquetas', modulos: 'modulos' };

// Ícono (lucide) según el nombre del tipo; la API no guarda íconos.
const ICONOS_TIPO = [
  ['mochila', 'Backpack'], ['credencial', 'IdCard'], ['celular', 'Smartphone'], ['telefono', 'Smartphone'],
  ['electron', 'Smartphone'], ['laptop', 'Laptop'], ['tableta', 'Laptop'], ['llave', 'KeyRound'],
  ['audifono', 'Headphones'], ['cartera', 'Wallet'], ['monedero', 'Wallet'], ['lente', 'Glasses'],
  ['paraguas', 'Umbrella'], ['ropa', 'Shirt'], ['libro', 'BookOpen'], ['cuaderno', 'BookOpen'],
  ['calculadora', 'Calculator'], ['termo', 'Milk'], ['botella', 'Milk'], ['reloj', 'Watch'],
  ['cargador', 'Cable'], ['cable', 'Cable'], ['util', 'PencilRuler'],
];
const iconoPara = (nombre) => ICONOS_TIPO.find(([clave]) => normalizar(nombre).includes(clave))?.[1] ?? null;

const ADAPTAR_CATALOGO = {
  tiposObjeto: (t) => ({ id: t.id, nombre: t.nombre, descripcion: t.descripcion, icono: iconoPara(t.nombre) }),
  colores: (c) => ({ id: c.id, nombre: c.nombre, hex: c.codigoHex }),
  etiquetas: (e) => ({ id: e.id, nombre: e.nombre }),
  modulos: (m) => ({ id: m.id, nombre: m.nombre, ubicacion: m.ubicacion, horario: m.horarioAtencion }),
};

export const catalogosApi = {
  /** GET /api/catalogos/{tipo} (tipo en la forma de la UI: tiposObjeto, colores, etiquetas, modulos) */
  async obtener(tipo) {
    const lista = await http(`/api/catalogos/${RUTAS_CATALOGO[tipo] ?? tipo}`);
    return (lista ?? []).map(ADAPTAR_CATALOGO[tipo] ?? ((x) => x));
  },
  async todos() {
    const claves = Object.keys(RUTAS_CATALOGO);
    const listas = await Promise.all(claves.map((c) => catalogosApi.obtener(c)));
    return Object.fromEntries(claves.map((c, i) => [c, listas[i]]));
  },
};

/* ---------------- Objetos ---------------- */

/** La API filtra por estado, tipo, color y etiquetas; el texto libre y el módulo se filtran aquí. */
function filtrarEnCliente(lista, { q, moduloId }) {
  let r = lista;
  if (moduloId) r = r.filter((o) => o.moduloId === Number(moduloId));
  if (q) {
    const terminos = normalizar(q).split(/\s+/).filter(Boolean);
    r = r.filter((o) => {
      const texto = normalizar(`${o.nombre} ${o.descripcion} ${o.marca} ${o.lugarPerdida} ${o.folio}`);
      return terminos.every((t) => texto.includes(t));
    });
  }
  return r;
}

async function listarObjetos({ estado, tipoObjetoId, colorId, otrasEtiquetaIds } = {}) {
  const params = { tipoObjetoId, colorId, otrasEtiquetaIds };
  // Sin estado, el administrador recibiría solo los PERDIDO: para «todos» se piden ambos.
  const estados = estado ? [estado] : ['PERDIDO', 'RECLAMADO'];
  const listas = await Promise.all(estados.map((e) => http('/api/objetos', { params: { ...params, estado: e } })));
  return listas.flat().map(aObjeto);
}

/** Convierte una imagen en data URL (la que arma el formulario) en archivo para el multipart. */
async function aArchivo(fotografiaUrl) {
  if (!fotografiaUrl?.startsWith('data:')) return null; // sin cambio de foto en la edición
  const blob = await (await fetch(fotografiaUrl)).blob();
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  return new File([blob], `fotografia.${ext}`, { type: blob.type || 'image/jpeg' });
}

async function aFormData(datos) {
  const fd = new FormData();
  const archivo = datos.fotografiaArchivo ?? (await aArchivo(datos.fotografiaUrl));
  if (archivo) fd.append('fotografia', archivo);
  ['nombre', 'descripcion', 'marca', 'tipoObjetoId', 'colorId', 'lugarPerdida', 'moduloId'].forEach((k) => {
    if (datos[k] !== undefined && datos[k] !== null) fd.append(k, datos[k]);
  });
  (datos.otrasEtiquetaIds ?? []).forEach((id) => fd.append('otrasEtiquetaIds', id));
  return fd;
}

export const objetosApi = {
  /** GET /api/objetos?estado=&tipoObjetoId=&colorId=&otrasEtiquetaIds= */
  async listar(filtros = {}) {
    const lista = await listarObjetos(filtros);
    const orden = filtros.estado === 'RECLAMADO' ? 'fechaReclamo' : 'fechaRegistro';
    return filtrarEnCliente(lista, filtros).sort((a, b) => (b[orden] ?? '').localeCompare(a[orden] ?? '') || b.id - a.id);
  },

  /** GET /api/objetos/{id}. Para el administrador agrega sus peticiones y a quién se entregó. */
  async obtener(id) {
    const objeto = aObjeto(await http(`/api/objetos/${id}`));
    if (!esAdmin()) return { ...objeto, reclamante: null, peticiones: [] };

    const todas = await http('/api/peticiones');
    const propias = await Promise.all(
      (todas ?? []).filter((p) => p.objetoId === objeto.id).map((p) => http(`/api/peticiones/${p.id}`).then(aPeticion)),
    );
    const entrega = propias
      .filter((p) => p.estado === 'LIBERADA')
      .sort((a, b) => (b.fechaLiberacion ?? '').localeCompare(a.fechaLiberacion ?? ''))[0];
    return { ...objeto, reclamante: objeto.estado === 'RECLAMADO' ? entrega?.solicitante ?? null : null, peticiones: propias };
  },

  /** POST /api/objetos (multipart/form-data) */
  async crear(datos) {
    return aObjeto(await http('/api/objetos', { method: 'POST', formData: await aFormData(datos) }));
  },

  /** PUT /api/objetos/{id} (multipart/form-data; la foto es opcional) */
  async actualizar(id, datos) {
    return aObjeto(await http(`/api/objetos/${id}`, { method: 'PUT', formData: await aFormData(datos) }));
  },

  /** DELETE /api/objetos/{id} (borrado lógico en la API) */
  eliminar: (id) => http(`/api/objetos/${id}`, { method: 'DELETE' }),
};

/* ---------------- Peticiones ---------------- */

/*
 * La API solo deja listar peticiones al administrador. Para que el estudiante vea «Mis solicitudes»
 * y sepa si ya reclamó un objeto, se guardan en este navegador las que él mismo crea.
 * Su estado no se actualiza cuando el administrador las libera (la API no tiene un endpoint para eso).
 */
const claveMias = (matricula) => `univa-op:mis-peticiones:${matricula}`;

function leerMias(matricula) {
  try {
    return JSON.parse(localStorage.getItem(claveMias(matricula)) || '[]');
  } catch {
    return [];
  }
}

function guardarMia(matricula, peticion) {
  const lista = [peticion, ...leerMias(matricula).filter((p) => p.id !== peticion.id)];
  try {
    localStorage.setItem(claveMias(matricula), JSON.stringify(lista));
  } catch {
    // Sin espacio: la petición existe en el servidor aunque no se recuerde aquí.
  }
}

export const peticionesApi = {
  /** GET /api/peticiones?matricula= (administrador). Para el estudiante, las guardadas en este navegador. */
  async listar({ matricula } = {}) {
    if (!esAdmin()) {
      const propia = matricula ?? usuarioActual()?.matricula;
      return propia ? leerMias(propia) : [];
    }
    const lista = await http('/api/peticiones', { params: { matricula } });
    // La fila de la lista no trae correo, objeto completo ni quién liberó: se completa con el detalle.
    return Promise.all((lista ?? []).map((p) => http(`/api/peticiones/${p.id}`).then(aPeticion)));
  },

  /** GET /api/peticiones/{id} */
  obtener: async (id) => aPeticion(await http(`/api/peticiones/${id}`)),

  /** POST /api/peticiones. La matrícula la toma la API del token. */
  async crear({ objetoId, tipo }) {
    const creada = await http('/api/peticiones', { method: 'POST', body: { objetoId, tipo } });
    let objeto = null;
    try {
      objeto = resumenObjeto(await http(`/api/objetos/${objetoId}`));
    } catch {
      // El resumen del objeto es solo para la lista de «Mis solicitudes».
    }
    const peticion = aPeticionResumen(creada, objeto);
    guardarMia(creada.matricula, peticion);
    return peticion;
  },

  /** GET /api/peticiones/{id}/contacto-previo (solo reclamos de error). */
  async contactoPrevio(id) {
    const [contacto, detalle] = await Promise.all([http(`/api/peticiones/${id}/contacto-previo`), http(`/api/peticiones/${id}`)]);
    return {
      nombre: contacto.nombre,
      matricula: contacto.matricula,
      correo: contacto.correo,
      telefono: contacto.telefono ?? '',
      programa: null,
      aviso: contacto.aviso,
      fechaReclamo: detalle.objeto?.fechaReclamo ?? null,
    };
  },

  /** PUT /api/peticiones/{id}/liberacion. La API toma al administrador del token. */
  liberar: async (id) => aPeticion(await http(`/api/peticiones/${id}/liberacion`, { method: 'PUT' })),
};
