/**
 * @file repositoryService.js
 * @description Study repositories (FE-10, FE-12 and FE-11).
 *
 * All the listings return the same envelope so that the pagination
 * works the same with mocks and with the real backend:
 *   { items, total, page, size, totalPages }
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { nextId, store } from '../mocks/store.js';
import { withoutPassword } from '../utils/users.js';
import { currentUser } from './authService.js';

/**
 * @typedef {object} RepositoryFilters
 * @property {number|string|null} [subjectId]
 * @property {number|string|null} [semester]
 * @property {string} [search]
 * @property {'recent'|'popular'|'name'} [order]
 * @property {number} [page]
 * @property {number} [size]
 */

/** Like key of a repository for a user. */
const likeKey = (repositoryId, username) => `${repositoryId}::${username}`;

/** Trims the text to compare without uppercase or accents. */
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Adds the subject, the author and the calculated data that the
 * interface needs to the repository.
 * @param {object} repository
 * @returns {object}
 */
function enrich(repository) {
  const subject = store.subjects.find((item) => item.id === Number(repository.subjectId)) ?? null;
  const author = store.users.find((user) => user.username === repository.authorUsername);
  const documentCount = store.documents.filter(
    (document) => document.repositoryId === repository.id,
  ).length;
  const username = currentUser()?.username;

  return {
    ...repository,
    subject,
    author: withoutPassword(author),
    documentCount,
    liked: username ? store.likedRepositories.has(likeKey(repository.id, username)) : false,
  };
}

/**
 * Normalizes the backend response to our pagination envelope.
 * @param {any} data
 * @param {number} page
 * @param {number} size
 */
function normalizePage(data, page, size) {
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page, size, totalPages: 1 };
  }

  const items = data?.items ?? data?.content ?? [];
  const total = data?.total ?? items.length;

  return {
    items,
    total,
    page: data?.page ?? page,
    size: data?.size ?? size,
    totalPages: data?.totalPages ?? Math.max(1, Math.ceil(total / size)),
  };
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Lists repositories with filters and pagination.
 * @param {RepositoryFilters} [filters]
 * @returns {Promise<{ items: object[], total: number, page: number, size: number, totalPages: number }>}
 */
export async function getRepositories(filters = {}) {
  const {
    subjectId = null,
    semester = null,
    search = '',
    order = 'recent',
    page = 1,
    size = 9,
  } = filters;

  if (!USE_MOCK) {
    const { data } = await http.get('/repositories', {
      params: { subjectId, semester, q: search, order, page, size },
    });
    return normalizePage(data, page, size);
  }

  await waitForMock();

  const term = normalize(search);

  /** Finds the subject of a repository, to read its semester. */
  const subjectOf = (repository) =>
    store.subjects.find((item) => item.id === Number(repository.subjectId)) ?? null;

  let list = store.repositories.filter((repository) => {
    const subjectMatches = !subjectId || Number(repository.subjectId) === Number(subjectId);
    if (!subjectMatches) return false;

    const semesterMatches = !semester || subjectOf(repository)?.semester === Number(semester);
    if (!semesterMatches) return false;

    if (!term) return true;

    const subject = subjectOf(repository);
    const text = normalize(`${repository.name} ${repository.description} ${subject?.name ?? ''}`);
    return text.includes(term);
  });

  list = [...list].sort((a, b) => {
    if (order === 'popular') return b.likes - a.likes;
    if (order === 'name') return a.name.localeCompare(b.name, 'es');
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const total = list.length;
  const start = (page - 1) * size;

  return {
    items: list.slice(start, start + size).map(enrich),
    total,
    page,
    size,
    totalPages: Math.max(1, Math.ceil(total / size)),
  };
}

/**
 * Gets a repository by id.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if it does not exist.
 */
export async function getRepository(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/repositories/${id}`);
    return data;
  }

  await waitForMock();

  const repository = store.repositories.find((item) => item.id === id);
  if (!repository) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  return enrich(repository);
}

/**
 * Lists the repositories of a user (view 16, public profile).
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function getRepositoriesByUser(username) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/users/${username}/repositories`);
    return normalizePage(data, 1, data?.total ?? 10).items;
  }

  await waitForMock();

  return store.repositories
    .filter((repository) => repository.authorUsername === username)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(enrich);
}

// ── Writing ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} RepositoryData
 * @property {string} name
 * @property {string} description
 * @property {number|string} subjectId
 */

/**
 * Creates a repository for the session user.
 * @param {RepositoryData} data
 * @returns {Promise<object>}
 */
export async function createRepository(data) {
  if (!USE_MOCK) {
    const { data: created } = await http.post('/repositories', data);
    return created;
  }

  await waitForMock();

  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para crear un repositorio.', { status: 401 });
  }

  /** @type {Record<string, string>} */
  const fields = {};
  const name = String(data.name ?? '').trim();
  const description = String(data.description ?? '').trim();

  if (name.length < 3) fields.name = 'El nombre debe tener al menos 3 caracteres.';
  if (description.length < 10) {
    fields.description = 'Describe el repositorio en al menos 10 caracteres.';
  }
  if (!data.subjectId) fields.subjectId = 'Selecciona una materia.';

  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del repositorio.', { status: 400, fields });
  }

  const now = new Date().toISOString();
  const repository = {
    id: nextId('repository'),
    name,
    description,
    subjectId: Number(data.subjectId),
    authorUsername: user.username,
    likes: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.repositories.unshift(repository);
  return enrich(repository);
}

/**
 * Updates a repository. Only the owner can do it.
 * @param {string} id
 * @param {RepositoryData} data
 * @returns {Promise<object>}
 */
export async function updateRepository(id, data) {
  if (!USE_MOCK) {
    const { data: updated } = await http.put(`/repositories/${id}`, data);
    return updated;
  }

  await waitForMock();

  const repository = store.repositories.find((item) => item.id === id);
  if (!repository) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user || user.username !== repository.authorUsername) {
    throw new ApiError('Solo el dueño puede editar este repositorio.', { status: 403 });
  }

  repository.name = String(data.name ?? repository.name).trim();
  repository.description = String(data.description ?? repository.description).trim();
  repository.subjectId = Number(data.subjectId ?? repository.subjectId);
  repository.updatedAt = new Date().toISOString();

  return enrich(repository);
}

/**
 * Deletes a repository and its documents. Only the owner can do it.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteRepository(id) {
  if (!USE_MOCK) {
    await http.delete(`/repositories/${id}`);
    return;
  }

  await waitForMock();

  const index = store.repositories.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user || user.username !== store.repositories[index].authorUsername) {
    throw new ApiError('Solo el dueño puede eliminar este repositorio.', { status: 403 });
  }

  store.repositories.splice(index, 1);
  store.documents = store.documents.filter((document) => document.repositoryId !== id);
}

/**
 * Gives or removes the like of the session user.
 * @param {string} id
 * @returns {Promise<{ liked: boolean, likes: number }>}
 */
export async function toggleRepositoryLike(id) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/repositories/${id}/like`);
    return data;
  }

  await waitForMock(200);

  const repository = store.repositories.find((item) => item.id === id);
  if (!repository) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para dar me gusta.', { status: 401 });
  }

  const key = likeKey(id, user.username);

  if (store.likedRepositories.has(key)) {
    store.likedRepositories.delete(key);
    repository.likes = Math.max(0, repository.likes - 1);
  } else {
    store.likedRepositories.add(key);
    repository.likes += 1;
  }

  return { liked: store.likedRepositories.has(key), likes: repository.likes };
}
