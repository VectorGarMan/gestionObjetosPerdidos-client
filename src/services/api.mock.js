/**
 * Implementación simulada de la API. Respeta las mismas firmas, reglas de negocio
 * y códigos de error que se esperan del backend Spring Boot.
 */
import { catalogos } from '../data/catalogos.js';
import { ApiError } from './http.js';
import { guardarDb, latencia, leerDb, siguienteId } from './mockDb.js';
import { ahoraISO, hoyISO, normalizar } from '../utils/format.js';

const clonar = (v) => structuredClone(v);

function buscarUsuario(db, matricula) {
  return db.usuarios.find((u) => u.matricula === matricula) ?? null;
}

function resumenUsuario(u) {
  return u ? { nombre: u.nombre, matricula: u.matricula, correo: u.correo, programa: u.programa } : null;
}

/* ---------------- Usuarios ---------------- */

export const usuariosApi = {
  /** POST /api/usuarios/identificacion */
  async identificar(correo) {
    await latencia(450, 800);
    const db = leerDb();
    const u = db.usuarios.find((x) => x.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!u) {
      throw new ApiError(404, 'NO_ENCONTRADO', 'No encontramos una cuenta con ese correo. Verifica que sea el correo registrado en la universidad.');
    }
    if (u.rol !== 'ESTUDIANTE' && u.rol !== 'ADMINISTRADOR') {
      throw new ApiError(403, 'SIN_ROL', 'Tu cuenta no tiene un rol asignado para usar la plataforma. Acude con el personal administrador.');
    }
    const { nombre, matricula, rol, programa } = u;
    return { id: u.id, nombre, correo: u.correo, matricula, rol, programa };
  },
};

/* ---------------- Catálogos ---------------- */

export const catalogosApi = {
  /** GET /api/catalogos/{tipo} */
  async obtener(tipo) {
    await latencia(80, 160);
    if (!catalogos[tipo]) throw new ApiError(404, 'CATALOGO', 'Catálogo no encontrado.');
    return clonar(catalogos[tipo]);
  },
  async todos() {
    await latencia(80, 160);
    return clonar(catalogos);
  },
};

/* ---------------- Objetos ---------------- */

function coincide(obj, f) {
  if (f.estado && obj.estado !== f.estado) return false;
  if (f.tipoObjetoId && obj.tipoObjetoId !== Number(f.tipoObjetoId)) return false;
  if (f.colorId && obj.colorId !== Number(f.colorId)) return false;
  if (f.otrasEtiquetaIds?.length && !f.otrasEtiquetaIds.every((id) => obj.otrasEtiquetaIds.includes(Number(id)))) return false;
  if (f.moduloId && obj.moduloId !== Number(f.moduloId)) return false;
  if (f.q) {
    const texto = normalizar(`${obj.nombre} ${obj.descripcion} ${obj.marca} ${obj.lugarPerdida} ${obj.folio}`);
    if (!normalizar(f.q).split(/\s+/).every((t) => texto.includes(t))) return false;
  }
  return true;
}

export const objetosApi = {
  /** GET /api/objetos?estado=&tipoObjetoId=&colorId=&otrasEtiquetaIds= */
  async listar(filtros = {}) {
    await latencia();
    const db = leerDb();
    const orden = filtros.estado === 'RECLAMADO' ? 'fechaReclamo' : 'fechaRegistro';
    return clonar(
      db.objetos
        .filter((o) => coincide(o, filtros))
        .sort((a, b) => (b[orden] ?? '').localeCompare(a[orden] ?? '') || b.id - a.id),
    );
  },

  /** GET /api/objetos/{id} */
  async obtener(id) {
    await latencia(180, 380);
    const db = leerDb();
    const obj = db.objetos.find((o) => o.id === Number(id));
    if (!obj) throw new ApiError(404, 'NO_ENCONTRADO', 'Este objeto ya no está disponible. Es posible que haya sido eliminado.');
    const relacionadas = db.peticiones
      .filter((p) => p.objetoId === obj.id)
      .map((p) => ({ ...p, solicitante: resumenUsuario(buscarUsuario(db, p.matricula)) }));
    return clonar({ ...obj, reclamante: resumenUsuario(buscarUsuario(db, obj.reclamadoPor)), peticiones: relacionadas });
  },

  /** POST /api/objetos (multipart/form-data) */
  async crear(datos) {
    await latencia(500, 900);
    const db = leerDb();
    const id = siguienteId(db.objetos);
    const nuevo = {
      id,
      folio: `OP-${String(100 + id).padStart(4, '0')}`,
      estado: 'PERDIDO',
      fechaReclamo: null,
      reclamadoPor: null,
      fechaRegistro: hoyISO(),
      ...datos,
    };
    db.objetos.unshift(nuevo);
    guardarDb(db);
    return clonar(nuevo);
  },

  /** PUT /api/objetos/{id} */
  async actualizar(id, datos) {
    await latencia(400, 750);
    const db = leerDb();
    const i = db.objetos.findIndex((o) => o.id === Number(id));
    if (i < 0) throw new ApiError(404, 'NO_ENCONTRADO', 'Este objeto ya no existe.');
    db.objetos[i] = { ...db.objetos[i], ...datos, id: db.objetos[i].id, folio: db.objetos[i].folio };
    guardarDb(db);
    return clonar(db.objetos[i]);
  },

  /** DELETE /api/objetos/{id} */
  async eliminar(id) {
    await latencia(350, 650);
    const db = leerDb();
    const existe = db.objetos.some((o) => o.id === Number(id));
    if (!existe) throw new ApiError(404, 'NO_ENCONTRADO', 'Este objeto ya no existe.');
    db.objetos = db.objetos.filter((o) => o.id !== Number(id));
    db.peticiones = db.peticiones.filter((p) => p.objetoId !== Number(id) || p.estado === 'LIBERADA');
    guardarDb(db);
    return null;
  },
};

/* ---------------- Peticiones ---------------- */

function expandirPeticion(db, p) {
  const objeto = db.objetos.find((o) => o.id === p.objetoId);
  return {
    ...p,
    solicitante: resumenUsuario(buscarUsuario(db, p.matricula)),
    objeto: objeto
      ? {
          id: objeto.id,
          folio: objeto.folio,
          nombre: objeto.nombre,
          estado: objeto.estado,
          tipoObjetoId: objeto.tipoObjetoId,
          colorId: objeto.colorId,
          moduloId: objeto.moduloId,
          fotografiaUrl: objeto.fotografiaUrl,
          lugarPerdida: objeto.lugarPerdida,
          fechaRegistro: objeto.fechaRegistro,
        }
      : null,
  };
}

export const peticionesApi = {
  /** GET /api/peticiones?matricula= */
  async listar({ matricula } = {}) {
    await latencia();
    const db = leerDb();
    return clonar(
      db.peticiones
        .filter((p) => !matricula || p.matricula.toLowerCase() === matricula.toLowerCase())
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
        .map((p) => expandirPeticion(db, p)),
    );
  },

  /** GET /api/peticiones/{id} */
  async obtener(id) {
    await latencia(150, 300);
    const db = leerDb();
    const p = db.peticiones.find((x) => x.id === Number(id));
    if (!p) throw new ApiError(404, 'NO_ENCONTRADO', 'La petición no existe.');
    return clonar(expandirPeticion(db, p));
  },

  /** POST /api/peticiones */
  async crear({ objetoId, tipo, matricula }) {
    await latencia(500, 850);
    const db = leerDb();
    const obj = db.objetos.find((o) => o.id === Number(objetoId));
    const tipoEsperado = obj?.estado === 'PERDIDO' ? 'RECLAMO' : 'RECLAMO_ERROR';
    if (!obj || tipo !== tipoEsperado) {
      throw new ApiError(409, 'OBJETO_CAMBIO_ESTADO', 'Este objeto cambió de estado. Actualiza la pantalla para ver su situación actual.');
    }
    if (tipo === 'RECLAMO_ERROR' && obj.reclamadoPor === matricula) {
      throw new ApiError(409, 'RECLAMO_PROPIO', 'Este objeto ya te fue entregado a ti. Si hay un problema, acude al módulo.');
    }
    const duplicada = db.peticiones.some((p) => p.objetoId === obj.id && p.matricula === matricula && p.estado === 'PENDIENTE');
    if (duplicada) {
      throw new ApiError(409, 'PETICION_DUPLICADA', 'Ya tienes una petición pendiente para este objeto.');
    }
    const id = siguienteId(db.peticiones);
    const nueva = {
      id,
      folio: `PT-${String(200 + id).padStart(4, '0')}`,
      tipo,
      objetoId: obj.id,
      matricula,
      estado: 'PENDIENTE',
      fechaCreacion: ahoraISO(),
      fechaLiberacion: null,
      liberadaPor: null,
    };
    db.peticiones.unshift(nueva);
    guardarDb(db);
    return clonar(expandirPeticion(db, nueva));
  },

  /** GET /api/peticiones/{id}/contacto-previo */
  async contactoPrevio(id) {
    await latencia(250, 450);
    const db = leerDb();
    const p = db.peticiones.find((x) => x.id === Number(id));
    if (!p || p.tipo !== 'RECLAMO_ERROR') throw new ApiError(400, 'NO_APLICA', 'Solo los reclamos de error tienen contacto previo.');
    const obj = db.objetos.find((o) => o.id === p.objetoId);
    const u = buscarUsuario(db, obj?.reclamadoPor);
    if (!u) throw new ApiError(404, 'SIN_CONTACTO', 'No hay registro del estudiante que reclamó el objeto.');
    return { nombre: u.nombre, matricula: u.matricula, correo: u.correo, telefono: u.telefono, programa: u.programa, fechaReclamo: obj.fechaReclamo };
  },

  /** PUT /api/peticiones/{id}/liberacion */
  async liberar(id, { administrador }) {
    await latencia(450, 800);
    const db = leerDb();
    const p = db.peticiones.find((x) => x.id === Number(id));
    if (!p) throw new ApiError(404, 'NO_ENCONTRADO', 'La petición no existe.');
    if (p.estado === 'LIBERADA') {
      throw new ApiError(409, 'PETICION_LIBERADA', 'Esta petición ya fue liberada. Actualiza la lista para ver su estado.');
    }
    const obj = db.objetos.find((o) => o.id === p.objetoId);
    if (p.tipo === 'RECLAMO') {
      if (!obj || obj.estado !== 'PERDIDO') {
        throw new ApiError(409, 'OBJETO_CAMBIO_ESTADO', 'El objeto ya fue entregado a otra persona. Revisa el historial.');
      }
      obj.estado = 'RECLAMADO';
      obj.fechaReclamo = hoyISO();
      obj.reclamadoPor = p.matricula;
      // Las demás peticiones de reclamo sobre el mismo objeto ya no proceden.
      db.peticiones
        .filter((x) => x.id !== p.id && x.objetoId === obj.id && x.tipo === 'RECLAMO' && x.estado === 'PENDIENTE')
        .forEach((x) => {
          x.estado = 'LIBERADA';
          x.fechaLiberacion = ahoraISO();
          x.liberadaPor = administrador;
          x.resolucion = 'NO_PROCEDE';
        });
    }
    p.estado = 'LIBERADA';
    p.fechaLiberacion = ahoraISO();
    p.liberadaPor = administrador;
    guardarDb(db);
    return clonar(expandirPeticion(db, p));
  },
};
