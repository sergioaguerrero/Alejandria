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
import { nextId, recordMockSearchTerm, store } from '../mocks/store.js';
import { withoutPassword } from '../utils/users.js';
import { currentUser } from './authService.js';
import { emitMockNotification, notifyFollowersOfNewContent } from './notificationService.js';

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
function getCollaboratorRecords(repositoryId) {
  return (store.repositoryCollaborators || []).filter((c) => c.repositoryId === repositoryId);
}

/**
 * Checks whether a user is an accepted collaborator on a repository (FE-35).
 * @param {string} repositoryId
 * @param {string} [username]
 * @returns {boolean}
 */
export function isAcceptedCollaborator(repositoryId, username) {
  if (!username) return false;
  return getCollaboratorRecords(repositoryId).some(
    (c) => c.username === username && c.status === 'aceptado',
  );
}

function countRepositoryFollowers(repositoryId) {
  const prefix = `${repositoryId}::`;
  return [...(store.followedRepositories ?? [])].filter((key) => key.startsWith(prefix)).length;
}

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
    followed: username ? (store.followedRepositories?.has(likeKey(repository.id, username)) ?? false) : false,
    followersCount: countRepositoryFollowers(repository.id),
    collaboratorStatus: username
      ? (getCollaboratorRecords(repository.id).find((c) => c.username === username)?.status ?? null)
      : null,
    isCollaborator: isAcceptedCollaborator(repository.id, username),
    canUpload: Boolean(
      username &&
        (username === repository.authorUsername || isAcceptedCollaborator(repository.id, username)),
    ),
    collaboratorsCount: getCollaboratorRecords(repository.id).filter(
      (c) => c.status === 'aceptado',
    ).length,
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

  recordMockSearchTerm(search);

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
  notifyFollowersOfNewContent({
    authorUsername: user.username,
    title: `Nuevo repositorio de @${user.username}`,
    message: `@${user.username} creó el repositorio "${repository.name}".`,
    targetUrl: `/repositories/${repository.id}`,
  });
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
    if (repository.authorUsername !== user.username) {
      emitMockNotification({
        recipientUsername: repository.authorUsername,
        type: 'like',
        title: 'Nuevo me gusta en tu repositorio',
        message: `A @${user.username} le gustó tu repositorio "${repository.name}".`,
        targetUrl: `/repositories/${repository.id}`,
      });
    }
  }

  return { liked: store.likedRepositories.has(key), likes: repository.likes };
}

/**
 * Follows or unfollows a repository for the session user.
 * @param {string} id
 * @returns {Promise<{ followed: boolean }>}
 */
export async function toggleFollowRepository(id) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/repositories/${encodeURIComponent(id)}/follow`);
    return data;
  }

  await waitForMock(200);

  const repository = store.repositories.find((item) => item.id === id);
  if (!repository) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para seguir este repositorio.', { status: 401 });
  }

  const key = likeKey(id, user.username);
  if (!store.followedRepositories) {
    store.followedRepositories = new Set();
  }

  const wasFollowed = store.followedRepositories.has(key);
  if (wasFollowed) {
    store.followedRepositories.delete(key);
  } else {
    store.followedRepositories.add(key);
  }

  return { followed: !wasFollowed, followersCount: countRepositoryFollowers(id) };
}

/**
 * Returns all repositories followed by the current user.
 * @returns {Promise<object[]>}
 */
/**
 * Lists collaborators and pending invitations for a repository (FE-35, BE-43).
 * @param {string} repositoryId
 * @returns {Promise<object[]>}
 */
export async function getRepositoryCollaborators(repositoryId) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/repositories/${encodeURIComponent(repositoryId)}/collaborators`);
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  await waitForMock();
  const viewer = currentUser();
  const repository = store.repositories.find((r) => r.id === repositoryId);
  if (!repository) {
    throw new ApiError('No encontramos ese repositorio.', { status: 404 });
  }

  const isOwner = viewer?.username === repository.authorUsername;
  const records = getCollaboratorRecords(repositoryId).filter(
    (c) => c.status === 'aceptado' || isOwner || c.username === viewer?.username,
  );

  return records
    .map((record) => {
      const user = store.users.find((u) => u.username === record.username);
      return {
        ...record,
        user: user ? withoutPassword(user) : { username: record.username, semester: 1, role: 'student' },
      };
    })
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'aceptado' ? -1 : 1));
}

/**
 * Invites a student to collaborate on a repository (FE-35, BE-43).
 * @param {string} repositoryId
 * @param {string} targetUsername
 * @returns {Promise<object>}
 */
export async function inviteCollaborator(repositoryId, targetUsername) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para invitar colaboradores.', { status: 401 });
  }

  const cleanUsername = String(targetUsername || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
  if (!cleanUsername) {
    throw new ApiError('Ingresa o selecciona el usuario que deseas invitar.', { status: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(`/repositories/${encodeURIComponent(repositoryId)}/collaborators`, {
      username: cleanUsername,
    });
    return data;
  }

  await waitForMock();
  const repository = store.repositories.find((r) => r.id === repositoryId);
  if (!repository) {
    throw new ApiError('No encontramos ese repositorio.', { status: 404 });
  }
  if (repository.authorUsername !== user.username) {
    throw new ApiError('Solo el dueño del repositorio puede invitar colaboradores.', { status: 403 });
  }

  const targetUser = store.users.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.role !== 'admin',
  );
  if (!targetUser) {
    throw new ApiError(`No existe un estudiante registrado con @${cleanUsername}.`, { status: 404 });
  }
  if (targetUser.username === user.username) {
    throw new ApiError('Ya eres el dueño de este repositorio.', { status: 400 });
  }

  store.repositoryCollaborators = store.repositoryCollaborators || [];
  const existing = store.repositoryCollaborators.find(
    (c) => c.repositoryId === repositoryId && c.username === targetUser.username,
  );
  if (existing) {
    throw new ApiError(
      existing.status === 'aceptado'
        ? `@${targetUser.username} ya es colaborador de este repositorio.`
        : `@${targetUser.username} ya tiene una invitación pendiente.`,
      { status: 409 },
    );
  }

  store.counters.collaborator = (store.counters.collaborator || 0) + 1;
  const created = {
    id: `collab-${String(store.counters.collaborator).padStart(3, '0')}`,
    repositoryId,
    username: targetUser.username,
    status: 'pendiente',
    invitedBy: user.username,
    createdAt: new Date().toISOString(),
  };
  store.repositoryCollaborators.unshift(created);

  emitMockNotification({
    recipientUsername: targetUser.username,
    type: 'collab_invite',
    title: 'Invitación a colaborar',
    message: `@${user.username} te invitó a colaborar en "${repository.name}".`,
    targetUrl: `/repositories/${repositoryId}`,
  });

  return {
    ...created,
    user: withoutPassword(targetUser),
  };
}

/**
 * Accepts or rejects a pending collaboration invitation (FE-35, BE-43).
 * @param {string} repositoryId
 * @param {boolean} accept
 * @returns {Promise<{ status: string }>}
 */
export async function respondCollaboratorInvitation(repositoryId, accept) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para responder la invitación.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(
      `/repositories/${encodeURIComponent(repositoryId)}/collaborators/respond`,
      { accept: Boolean(accept) },
    );
    return data;
  }

  await waitForMock();
  const repository = store.repositories.find((r) => r.id === repositoryId);
  if (!repository) {
    throw new ApiError('No encontramos ese repositorio.', { status: 404 });
  }

  store.repositoryCollaborators = store.repositoryCollaborators || [];
  const index = store.repositoryCollaborators.findIndex(
    (c) => c.repositoryId === repositoryId && c.username === user.username && c.status === 'pendiente',
  );
  if (index === -1) {
    throw new ApiError('No tienes una invitación pendiente en este repositorio.', { status: 404 });
  }

  if (accept) {
    store.repositoryCollaborators[index] = {
      ...store.repositoryCollaborators[index],
      status: 'aceptado',
      respondedAt: new Date().toISOString(),
    };
    emitMockNotification({
      recipientUsername: repository.authorUsername,
      type: 'collab_invite',
      title: 'Invitación aceptada',
      message: `@${user.username} aceptó colaborar en "${repository.name}".`,
      targetUrl: `/repositories/${repositoryId}`,
    });
    return { status: 'aceptado' };
  }

  store.repositoryCollaborators.splice(index, 1);
  emitMockNotification({
    recipientUsername: repository.authorUsername,
    type: 'collab_invite',
    title: 'Invitación rechazada',
    message: `@${user.username} rechazó la invitación a colaborar en "${repository.name}".`,
    targetUrl: `/repositories/${repositoryId}`,
  });
  return { status: 'rechazado' };
}

/**
 * Removes an accepted collaborator or cancels a pending invite (FE-35, BE-43).
 * @param {string} repositoryId
 * @param {string} usernameToRemove
 * @returns {Promise<{ ok: boolean }>}
 */
export async function removeCollaborator(repositoryId, usernameToRemove) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para gestionar colaboradores.', { status: 401 });
  }

  if (!USE_MOCK) {
    await http.delete(
      `/repositories/${encodeURIComponent(repositoryId)}/collaborators/${encodeURIComponent(usernameToRemove)}`,
    );
    return { ok: true };
  }

  await waitForMock();
  const repository = store.repositories.find((r) => r.id === repositoryId);
  if (!repository) {
    throw new ApiError('No encontramos ese repositorio.', { status: 404 });
  }

  const isOwner = user.username === repository.authorUsername;
  const isSelfLeave = user.username === usernameToRemove;
  if (!isOwner && !isSelfLeave) {
    throw new ApiError('Solo el dueño o el propio colaborador pueden realizar esta acción.', {
      status: 403,
    });
  }

  store.repositoryCollaborators = (store.repositoryCollaborators || []).filter(
    (c) => !(c.repositoryId === repositoryId && c.username === usernameToRemove),
  );
  return { ok: true };
}

/**
 * Lists pending invitations and accepted collaborated repositories for current user (FE-35).
 * @returns {Promise<{ invitations: object[], collaboratedRepositories: object[] }>}
 */
export async function getMyCollaborations() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para ver tus colaboraciones.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/users/me/collaborations');
    return data;
  }

  await waitForMock();
  const mine = (store.repositoryCollaborators || []).filter((c) => c.username === user.username);

  const invitations = [];
  const collaboratedRepositories = [];

  for (const record of mine) {
    const repo = store.repositories.find((r) => r.id === record.repositoryId);
    if (!repo) continue;
    const enriched = enrich(repo);
    if (record.status === 'pendiente') {
      invitations.push({
        ...record,
        repository: enriched,
      });
    } else if (record.status === 'aceptado') {
      collaboratedRepositories.push(enriched);
    }
  }

  return { invitations, collaboratedRepositories };
}

export async function getFollowedRepositories() {
  const user = currentUser();
  if (!user) {
    return [];
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/repositories/followed');
    return data;
  }

  await waitForMock(150);

  if (!store.followedRepositories) {
    store.followedRepositories = new Set();
  }

  const list = store.repositories
    .filter((repo) => store.followedRepositories.has(likeKey(repo.id, user.username)))
    .map(enrich);

  return list;
}
