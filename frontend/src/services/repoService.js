/**
 * @file repoService.js
 * @description Repositorios de estudio (FE-10, FE-12 y FE-11).
 *
 * Todos los listados devuelven el mismo sobre para que la paginación
 * funcione igual con mocks y con el backend real:
 *   { items, total, pagina, tamano, totalPaginas }
 */

import { USE_MOCK, esperarMock } from './config.js';
import { ErrorApi } from './errores.js';
import http from './http.js';
import { siguienteId, store } from '../mocks/store.js';
import { sinPassword } from '../utils/usuarios.js';
import { usuarioActual } from './authService.js';

/**
 * @typedef {object} FiltrosRepos
 * @property {number|string|null} [materiaId]
 * @property {string} [busqueda]
 * @property {'recientes'|'populares'|'nombre'} [orden]
 * @property {number} [pagina]
 * @property {number} [tamano]
 */

/** Clave del me gusta de un repo para un usuario. */
const claveLike = (repoId, username) => `${repoId}::${username}`;

/** Recorta el texto para comparar sin mayúsculas ni tildes. */
function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Agrega al repo la materia, el autor y los datos calculados que
 * necesita la interfaz.
 * @param {object} repo
 * @returns {object}
 */
function enriquecer(repo) {
  const materia = store.materias.find((item) => item.id === Number(repo.materiaId)) ?? null;
  const autor = store.usuarios.find((usuario) => usuario.username === repo.autorUsername);
  const cantidadDocumentos = store.documentos.filter(
    (documento) => documento.repoId === repo.id,
  ).length;
  const username = usuarioActual()?.username;

  return {
    ...repo,
    materia,
    autor: sinPassword(autor),
    cantidadDocumentos,
    likeado: username ? store.likesRepos.has(claveLike(repo.id, username)) : false,
  };
}

/**
 * Normaliza la respuesta del backend a nuestro sobre de paginación.
 * @param {any} data
 * @param {number} pagina
 * @param {number} tamano
 */
function normalizarPagina(data, pagina, tamano) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, pagina, tamano, totalPaginas: 1 };
  }

  const items = data?.items ?? data?.contenido ?? [];
  const total = data?.total ?? items.length;

  return {
    items,
    total,
    pagina: data?.pagina ?? pagina,
    tamano: data?.tamano ?? tamano,
    totalPaginas: data?.totalPaginas ?? Math.max(1, Math.ceil(total / tamano)),
  };
}

// ── Consultas ──────────────────────────────────────────────────────────────

/**
 * Lista repositorios con filtros y paginación.
 * @param {FiltrosRepos} [filtros]
 * @returns {Promise<{ items: object[], total: number, pagina: number, tamano: number, totalPaginas: number }>}
 */
export async function obtenerRepos(filtros = {}) {
  const {
    materiaId = null,
    busqueda = '',
    orden = 'recientes',
    pagina = 1,
    tamano = 9,
  } = filtros;

  if (!USE_MOCK) {
    const { data } = await http.get('/repos', {
      params: { materiaId, q: busqueda, orden, pagina, tamano },
    });
    return normalizarPagina(data, pagina, tamano);
  }

  await esperarMock();

  const termino = normalizar(busqueda);

  let lista = store.repos.filter((repo) => {
    const coincideMateria = !materiaId || Number(repo.materiaId) === Number(materiaId);
    if (!coincideMateria) return false;

    if (!termino) return true;

    const materia = store.materias.find((item) => item.id === Number(repo.materiaId));
    const texto = normalizar(`${repo.nombre} ${repo.descripcion} ${materia?.nombre ?? ''}`);
    return texto.includes(termino);
  });

  lista = [...lista].sort((a, b) => {
    if (orden === 'populares') return b.likes - a.likes;
    if (orden === 'nombre') return a.nombre.localeCompare(b.nombre, 'es');
    return new Date(b.creadoEn) - new Date(a.creadoEn);
  });

  const total = lista.length;
  const inicio = (pagina - 1) * tamano;

  return {
    items: lista.slice(inicio, inicio + tamano).map(enriquecer),
    total,
    pagina,
    tamano,
    totalPaginas: Math.max(1, Math.ceil(total / tamano)),
  };
}

/**
 * Obtiene un repo por id.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ErrorApi} 404 si no existe.
 */
export async function obtenerRepo(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/repos/${id}`);
    return data;
  }

  await esperarMock();

  const repo = store.repos.find((item) => item.id === id);
  if (!repo) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }

  return enriquecer(repo);
}

/**
 * Lista los repos de un usuario (vista 16, perfil público).
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function obtenerReposDeUsuario(username) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/usuarios/${username}/repos`);
    return normalizarPagina(data, 1, data?.total ?? 10).items;
  }

  await esperarMock();

  return store.repos
    .filter((repo) => repo.autorUsername === username)
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
    .map(enriquecer);
}

// ── Escritura ──────────────────────────────────────────────────────────────

/**
 * @typedef {object} DatosRepo
 * @property {string} nombre
 * @property {string} descripcion
 * @property {number|string} materiaId
 */

/**
 * Crea un repo para el usuario de la sesión.
 * @param {DatosRepo} datos
 * @returns {Promise<object>}
 */
export async function crearRepo(datos) {
  if (!USE_MOCK) {
    const { data } = await http.post('/repos', datos);
    return data;
  }

  await esperarMock();

  const usuario = usuarioActual();
  if (!usuario) {
    throw new ErrorApi('Debes iniciar sesión para crear un repositorio.', { estado: 401 });
  }

  /** @type {Record<string, string>} */
  const campos = {};
  const nombre = String(datos.nombre ?? '').trim();
  const descripcion = String(datos.descripcion ?? '').trim();

  if (nombre.length < 3) campos.nombre = 'El nombre debe tener al menos 3 caracteres.';
  if (descripcion.length < 10) {
    campos.descripcion = 'Describe el repositorio en al menos 10 caracteres.';
  }
  if (!datos.materiaId) campos.materiaId = 'Selecciona una materia.';

  if (Object.keys(campos).length > 0) {
    throw new ErrorApi('Revisa los datos del repositorio.', { estado: 400, campos });
  }

  const ahora = new Date().toISOString();
  const repo = {
    id: siguienteId('repo'),
    nombre,
    descripcion,
    materiaId: Number(datos.materiaId),
    autorUsername: usuario.username,
    likes: 0,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  store.repos.unshift(repo);
  return enriquecer(repo);
}

/**
 * Actualiza un repo. Solo el dueño puede hacerlo.
 * @param {string} id
 * @param {DatosRepo} datos
 * @returns {Promise<object>}
 */
export async function actualizarRepo(id, datos) {
  if (!USE_MOCK) {
    const { data } = await http.put(`/repos/${id}`, datos);
    return data;
  }

  await esperarMock();

  const repo = store.repos.find((item) => item.id === id);
  if (!repo) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario || usuario.username !== repo.autorUsername) {
    throw new ErrorApi('Solo el dueño puede editar este repositorio.', { estado: 403 });
  }

  repo.nombre = String(datos.nombre ?? repo.nombre).trim();
  repo.descripcion = String(datos.descripcion ?? repo.descripcion).trim();
  repo.materiaId = Number(datos.materiaId ?? repo.materiaId);
  repo.actualizadoEn = new Date().toISOString();

  return enriquecer(repo);
}

/**
 * Elimina un repo y sus documentos. Solo el dueño puede hacerlo.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function eliminarRepo(id) {
  if (!USE_MOCK) {
    await http.delete(`/repos/${id}`);
    return;
  }

  await esperarMock();

  const indice = store.repos.findIndex((item) => item.id === id);
  if (indice === -1) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario || usuario.username !== store.repos[indice].autorUsername) {
    throw new ErrorApi('Solo el dueño puede eliminar este repositorio.', { estado: 403 });
  }

  store.repos.splice(indice, 1);
  store.documentos = store.documentos.filter((documento) => documento.repoId !== id);
}

/**
 * Da o quita el me gusta del usuario de la sesión.
 * @param {string} id
 * @returns {Promise<{ likeado: boolean, likes: number }>}
 */
export async function alternarLikeRepo(id) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/repos/${id}/like`);
    return data;
  }

  await esperarMock(200);

  const repo = store.repos.find((item) => item.id === id);
  if (!repo) {
    throw new ErrorApi('El repositorio no existe o fue eliminado.', { estado: 404 });
  }

  const usuario = usuarioActual();
  if (!usuario) {
    throw new ErrorApi('Inicia sesión para dar me gusta.', { estado: 401 });
  }

  const clave = claveLike(id, usuario.username);

  if (store.likesRepos.has(clave)) {
    store.likesRepos.delete(clave);
    repo.likes = Math.max(0, repo.likes - 1);
  } else {
    store.likesRepos.add(clave);
    repo.likes += 1;
  }

  return { likeado: store.likesRepos.has(clave), likes: repo.likes };
}
