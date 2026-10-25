/**
 * @file documentoService.js
 * @description Documentos de un repositorio (FE-15, FE-16 y FE-14).
 *
 * La subida reporta el progreso mediante un callback, que en modo real
 * se alimenta de `onUploadProgress` de Axios y en modo mock se simula.
 */

import { USE_MOCK, esperarMock } from './config.js';
import { ErrorApi } from './errores.js';
import http from './http.js';
import { siguienteId, store } from '../mocks/store.js';
import { usuarioActual } from './authService.js';
import { sinPassword } from '../utils/usuarios.js';
import { obtenerExtension, validarArchivo } from '../utils/validaciones.js';

/** Clave del me gusta de un documento para un usuario. */
const claveLike = (documentoId, username) => `${documentoId}::${username}`;

/**
 * Agrega al documento el repo, el autor y los datos calculados.
 * @param {object} documento
 * @returns {object}
 */
function enriquecer(documento) {
  const repo = store.repos.find((item) => item.id === documento.repoId) ?? null;
  const materia = repo
    ? store.materias.find((item) => item.id === Number(repo.materiaId)) ?? null
    : null;
  const autor = store.usuarios.find((usuario) => usuario.username === documento.autorUsername);
  const username = usuarioActual()?.username;

  return {
    ...documento,
    repo,
    materia,
    autor: sinPassword(autor),
    likeado: username
      ? store.likesDocumentos.has(claveLike(documento.id, username))
      : false,
  };
}

/**
 * Normaliza la respuesta de un listado del backend.
 * @param {any} data
 * @returns {object[]}
 */
function comoLista(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.contenido ?? [];
}

// ── Consultas ──────────────────────────────────────────────────────────────

/**
 * Lista los documentos de un repo, opcionalmente filtrados por corte.
 * @param {string} repoId
 * @param {{ corte?: number|string|null }} [opciones]
 * @returns {Promise<object[]>}
 */
export async function listarPorRepo(repoId, { corte = null } = {}) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/repos/${repoId}/documentos`, {
      params: { corte },
    });
    return comoLista(data);
  }

  await esperarMock();

  if (!store.repos.some((repo) => repo.id === repoId)) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }

  return store.documentos
    .filter((documento) => documento.repoId === repoId)
    .filter((documento) => !corte || Number(documento.corte) === Number(corte))
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
    .map(enriquecer);
}

/**
 * Obtiene un documento por id.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ErrorApi} 404 si no existe.
 */
export async function obtenerDocumento(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/documentos/${id}`);
    return data;
  }

  await esperarMock();

  const documento = store.documentos.find((item) => item.id === id);
  if (!documento) {
    throw new ErrorApi('El documento no existe o fue eliminado.', { estado: 404 });
  }

  return enriquecer(documento);
}

// ── Escritura ──────────────────────────────────────────────────────────────

/**
 * @typedef {object} DatosDocumento
 * @property {string} repoId
 * @property {string} titulo
 * @property {string} descripcion
 * @property {'apunte'|'guia'|'resumen'|'proyecto'} tipo
 * @property {1|2|3} corte
 * @property {string} tema
 * @property {string[]} etiquetas
 * @property {File|null} [archivo]
 */

/**
 * Valida los datos del formulario de documento.
 * @param {DatosDocumento} datos
 * @param {{ exigirArchivo?: boolean }} [opciones]
 * @returns {Record<string, string>} Errores por campo (vacío si todo está bien).
 */
function validarDocumento(datos, { exigirArchivo = true } = {}) {
  /** @type {Record<string, string>} */
  const campos = {};

  if (String(datos.titulo ?? '').trim().length < 3) {
    campos.titulo = 'El título debe tener al menos 3 caracteres.';
  }
  if (String(datos.descripcion ?? '').trim().length < 10) {
    campos.descripcion = 'Describe el documento en al menos 10 caracteres.';
  }
  if (!datos.tipo) {
    campos.tipo = 'Selecciona el tipo de material.';
  }
  if (!datos.corte) {
    campos.corte = 'Selecciona el corte.';
  }
  if (String(datos.tema ?? '').trim().length < 3) {
    campos.tema = 'Escribe el tema del documento.';
  }

  if (exigirArchivo) {
    const errorArchivo = validarArchivo(datos.archivo);
    if (errorArchivo) campos.archivo = errorArchivo;
  } else if (datos.archivo) {
    const errorArchivo = validarArchivo(datos.archivo);
    if (errorArchivo) campos.archivo = errorArchivo;
  }

  return campos;
}

/**
 * Convierte un File en el objeto de archivo que guarda el mock.
 * @param {File} archivo
 * @returns {{ nombre: string, extension: string, mime: string, tamanoBytes: number, url: string }}
 */
function archivoDesdeFile(archivo) {
  return {
    nombre: archivo.name,
    extension: obtenerExtension(archivo),
    mime: archivo.type || 'application/octet-stream',
    tamanoBytes: archivo.size,
    // URL temporal: permite previsualizar lo que se acaba de subir en la demo.
    url: URL.createObjectURL(archivo),
  };
}

/**
 * Simula el avance de una subida para que se vea la barra de progreso.
 * @param {(porcentaje: number) => void} [onProgress]
 */
async function simularProgreso(onProgress) {
  const pasos = [8, 22, 41, 58, 74, 88, 96, 100];

  for (const porcentaje of pasos) {
    await esperarMock(140);
    onProgress?.(porcentaje);
  }
}

/**
 * Sube un documento a un repo. Solo el dueño del repo puede hacerlo.
 * @param {DatosDocumento} datos
 * @param {(porcentaje: number) => void} [onProgress]
 * @returns {Promise<object>}
 */
export async function subirDocumento(datos, onProgress) {
  if (!USE_MOCK) {
    const formulario = new FormData();
    formulario.append('titulo', datos.titulo);
    formulario.append('descripcion', datos.descripcion);
    formulario.append('tipo', datos.tipo);
    formulario.append('corte', String(datos.corte));
    formulario.append('tema', datos.tema);
    formulario.append('etiquetas', JSON.stringify(datos.etiquetas ?? []));
    if (datos.archivo) formulario.append('archivo', datos.archivo);

    const { data } = await http.post(`/repos/${datos.repoId}/documentos`, formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evento) => {
        if (!evento.total) return;
        onProgress?.(Math.round((evento.loaded * 100) / evento.total));
      },
    });

    return data;
  }

  await esperarMock(300);

  const usuario = usuarioActual();
  if (!usuario) {
    throw new ErrorApi('Debes iniciar sesión para subir documentos.', { estado: 401 });
  }

  const repo = store.repos.find((item) => item.id === datos.repoId);
  if (!repo) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }
  if (usuario.username !== repo.autorUsername) {
    throw new ErrorApi('Solo el dueño del repositorio puede subir documentos.', {
      estado: 403,
    });
  }

  const campos = validarDocumento(datos);
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi('Revisa los datos del documento.', { estado: 400, campos });
  }

  await simularProgreso(onProgress);

  if (!datos.archivo) {
    throw new ErrorApi('Selecciona el archivo que quieres subir.', { estado: 400 });
  }

  const documento = {
    id: siguienteId('documento'),
    repoId: datos.repoId,
    titulo: String(datos.titulo).trim(),
    descripcion: String(datos.descripcion).trim(),
    tipo: datos.tipo,
    corte: Number(datos.corte),
    tema: String(datos.tema).trim(),
    etiquetas: datos.etiquetas ?? [],
    archivo: archivoDesdeFile(datos.archivo),
    autorUsername: usuario.username,
    vistas: 0,
    descargas: 0,
    likes: 0,
    creadoEn: new Date().toISOString(),
  };

  store.documentos.unshift(documento);
  return enriquecer(documento);
}

/**
 * Edita los datos de un documento. El archivo es opcional.
 * @param {string} id
 * @param {DatosDocumento} datos
 * @param {(porcentaje: number) => void} [onProgress]
 * @returns {Promise<object>}
 */
export async function editarDocumento(id, datos, onProgress) {
  if (!USE_MOCK) {
    const formulario = new FormData();
    formulario.append('titulo', datos.titulo);
    formulario.append('descripcion', datos.descripcion);
    formulario.append('tipo', datos.tipo);
    formulario.append('corte', String(datos.corte));
    formulario.append('tema', datos.tema);
    formulario.append('etiquetas', JSON.stringify(datos.etiquetas ?? []));
    if (datos.archivo) formulario.append('archivo', datos.archivo);

    const { data } = await http.put(`/documentos/${id}`, formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evento) => {
        if (!evento.total) return;
        onProgress?.(Math.round((evento.loaded * 100) / evento.total));
      },
    });

    return data;
  }

  await esperarMock(300);

  const documento = store.documentos.find((item) => item.id === id);
  if (!documento) {
    throw new ErrorApi('El documento no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario || usuario.username !== documento.autorUsername) {
    throw new ErrorApi('Solo el autor puede editar este documento.', { estado: 403 });
  }

  const campos = validarDocumento(datos, { exigirArchivo: false });
  if (Object.keys(campos).length > 0) {
    throw new ErrorApi('Revisa los datos del documento.', { estado: 400, campos });
  }

  if (datos.archivo) {
    await simularProgreso(onProgress);
    documento.archivo = archivoDesdeFile(datos.archivo);
  }

  documento.titulo = String(datos.titulo).trim();
  documento.descripcion = String(datos.descripcion).trim();
  documento.tipo = datos.tipo;
  documento.corte = Number(datos.corte);
  documento.tema = String(datos.tema).trim();
  documento.etiquetas = datos.etiquetas ?? documento.etiquetas;

  return enriquecer(documento);
}

/**
 * Elimina un documento. Solo el autor puede hacerlo.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eliminarDocumento(id) {
  if (!USE_MOCK) {
    await http.delete(`/documentos/${id}`);
    return;
  }

  await esperarMock();

  const indice = store.documentos.findIndex((item) => item.id === id);
  if (indice === -1) {
    throw new ErrorApi('El documento no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario || usuario.username !== store.documentos[indice].autorUsername) {
    throw new ErrorApi('Solo el autor puede eliminar este documento.', { estado: 403 });
  }

  store.documentos.splice(indice, 1);
}

/**
 * Registra una descarga y devuelve la URL del archivo.
 * @param {string} id
 * @returns {Promise<{ url: string, nombre: string }>}
 */
export async function descargarDocumento(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/documentos/${id}/descarga`, {
      responseType: 'blob',
    });
    return { url: URL.createObjectURL(data), nombre: `documento-${id}` };
  }

  await esperarMock(200);

  const documento = store.documentos.find((item) => item.id === id);
  if (!documento) {
    throw new ErrorApi('El documento no existe o fue eliminado.', { estado: 404 });
  }

  documento.descargas += 1;

  return { url: documento.archivo.url, nombre: documento.archivo.nombre };
}

/**
 * Da o quita el me gusta del usuario de la sesión.
 * @param {string} id
 * @returns {Promise<{ likeado: boolean, likes: number }>}
 */
export async function alternarLikeDocumento(id) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/documentos/${id}/like`);
    return data;
  }

  await esperarMock(200);

  const documento = store.documentos.find((item) => item.id === id);
  if (!documento) {
    throw new ErrorApi('El documento no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario) {
    throw new ErrorApi('Inicia sesión para dar me gusta.', { estado: 401 });
  }

  const clave = claveLike(id, usuario.username);

  if (store.likesDocumentos.has(clave)) {
    store.likesDocumentos.delete(clave);
    documento.likes = Math.max(0, documento.likes - 1);
  } else {
    store.likesDocumentos.add(clave);
    documento.likes += 1;
  }

  return { likeado: store.likesDocumentos.has(clave), likes: documento.likes };
}
