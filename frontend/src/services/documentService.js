/**
 * @file documentService.js
 * @description Documents of a repository (FE-15, FE-16 and FE-14).
 *
 * The upload reports the progress through a callback, which in real mode
 * is fed by Axios' `onUploadProgress` and in mock mode is simulated.
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { nextId, store } from '../mocks/store.js';
import { currentUser } from './authService.js';
import { emitMockNotification, notifyFollowersOfNewContent } from './notificationService.js';
import { isAcceptedCollaborator } from './repositoryService.js';
import { withoutPassword } from '../utils/users.js';
import { getExtension, validateFile } from '../utils/validations.js';

/** Like key of a document for a user. */
const likeKey = (documentId, username) => `${documentId}::${username}`;

/**
 * Adds the repository, the author and the calculated data to the document.
 * @param {object} document
 * @returns {object}
 */
function enrich(document) {
  const repository = store.repositories.find((item) => item.id === document.repositoryId) ?? null;
  const subject = repository
    ? store.subjects.find((item) => item.id === Number(repository.subjectId)) ?? null
    : null;
  const author = store.users.find((user) => user.username === document.authorUsername);
  const username = currentUser()?.username;

  return {
    ...document,
    repository,
    subject,
    author: withoutPassword(author),
    liked: username
      ? store.likedDocuments.has(likeKey(document.id, username))
      : false,
  };
}

/**
 * Normalizes the response of a backend listing.
 * @param {any} data
 * @returns {object[]}
 */
function asList(data) {
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.content ?? [];
}

/**
 * Normalizes the response of a backend paginated listing.
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

/** Trims the text to compare without uppercase or accents. */
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Lists the documents of a repository, optionally filtered by term.
 * @param {string} repositoryId
 * @param {{ term?: number|string|null }} [options]
 * @returns {Promise<object[]>}
 */
export async function listByRepository(repositoryId, { term = null } = {}) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/repositories/${repositoryId}/documents`, {
      params: { term },
    });
    return asList(data);
  }

  await waitForMock();

  if (!store.repositories.some((repository) => repository.id === repositoryId)) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }

  return store.documents
    .filter((document) => document.repositoryId === repositoryId)
    .filter((document) => !term || Number(document.term) === Number(term))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(enrich);
}

/**
 * @typedef {object} DocumentFilters
 * @property {string} [search]  Text of the title, topic, tags or repository.
 * @property {number|string|null} [subjectId]
 * @property {number|string|null} [semester]
 * @property {number|string|null} [term]
 * @property {string|null} [type]  Material type (apunte, guia, resumen, proyecto).
 * @property {string} [topic]
 * @property {'recent'|'popular'|'liked'} [order]
 * @property {number} [page]
 * @property {number} [size]
 */

/**
 * Searches documents with filters and pagination (view 11).
 * @param {DocumentFilters} [filters]
 * @returns {Promise<{ items: object[], total: number, page: number, size: number, totalPages: number }>}
 */
export async function getDocuments(filters = {}) {
  const {
    search = '',
    subjectId = null,
    semester = null,
    term = null,
    type = null,
    topic = '',
    order = 'recent',
    page = 1,
    size = 8,
  } = filters;

  if (!USE_MOCK) {
    const { data } = await http.get('/documents', {
      params: {
        q: search,
        subjectId,
        semester,
        term,
        type,
        topic,
        order,
        page,
        size,
      },
    });
    return normalizePage(data, page, size);
  }

  await waitForMock();

  const text = normalize(search);
  const topicText = normalize(topic);

  /** Subject of the repository the document belongs to. */
  const subjectOf = (document) => {
    const repository = store.repositories.find((item) => item.id === document.repositoryId);
    return repository
      ? store.subjects.find((subject) => subject.id === Number(repository.subjectId)) ?? null
      : null;
  };

  const list = store.documents
    .filter((document) => {
      const repository = store.repositories.find((item) => item.id === document.repositoryId);
      const subject = subjectOf(document);

      if (subjectId && Number(repository?.subjectId) !== Number(subjectId)) return false;
      if (semester && subject?.semester !== Number(semester)) return false;
      if (term && Number(document.term) !== Number(term)) return false;
      if (type && document.type !== type) return false;
      if (topicText && !normalize(document.topic).includes(topicText)) return false;

      if (text) {
        const haystack = normalize(
          [
            document.title,
            document.description,
            document.topic,
            ...(document.tags ?? []),
            repository?.name,
          ].join(' '),
        );
        if (!haystack.includes(text)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (order === 'popular') {
        return (b.views ?? 0) + (b.downloads ?? 0) - ((a.views ?? 0) + (a.downloads ?? 0));
      }
      if (order === 'liked') return (b.likes ?? 0) - (a.likes ?? 0);
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
 * Lists the documents of a user, newest first (view 12, my content).
 * @param {string} username
 * @returns {Promise<object[]>}
 */
export async function getDocumentsByUser(username) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/users/${username}/documents`);
    return asList(data);
  }

  await waitForMock();

  return store.documents
    .filter((document) => document.authorUsername === username)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(enrich);
}

/**
 * Gets a document by id.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if it does not exist.
 */
function recordInteraction(type, document) {
  if (!document) return;
  const user = currentUser();
  if (user) {
    store.interactions = store.interactions || [];
    store.interactions.push({
      type,
      documentId: document.id,
      subjectId: document.subjectId,
      username: user.username,
      createdAt: new Date().toISOString(),
    });
  }
}

export async function getDocument(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/documents/${id}`);
    return data;
  }

  await waitForMock();

  const document = store.documents.find((item) => item.id === id);
  if (!document) {
    throw new ApiError('El documento no existe o fue eliminado.', { status: 404 });
  }

  document.views = (document.views || 0) + 1;
  recordInteraction('view', document);

  return enrich(document);
}

// ── Writing ────────────────────────────────────────────────────────────────

/**
 * @typedef {object} DocumentData
 * @property {string} repositoryId
 * @property {string} title
 * @property {string} description
 * @property {'apunte'|'guia'|'resumen'|'proyecto'} type
 * @property {1|2|3} term
 * @property {string} topic
 * @property {string[]} tags
 * @property {File|null} [file]
 */

/**
 * Validates the data of the document form.
 * @param {DocumentData} data
 * @param {{ requireFile?: boolean }} [options]
 * @returns {Record<string, string>} Errors per field (empty if everything is fine).
 */
function validateDocument(data, { requireFile = true } = {}) {
  /** @type {Record<string, string>} */
  const fields = {};

  if (String(data.title ?? '').trim().length < 3) {
    fields.title = 'El título debe tener al menos 3 caracteres.';
  }
  if (String(data.description ?? '').trim().length < 10) {
    fields.description = 'Describe el documento en al menos 10 caracteres.';
  }
  if (!data.type) {
    fields.type = 'Selecciona el tipo de material.';
  }
  if (!data.term) {
    fields.term = 'Selecciona el corte.';
  }
  if (String(data.topic ?? '').trim().length < 3) {
    fields.topic = 'Escribe el tema del documento.';
  }

  if (requireFile) {
    const fileError = validateFile(data.file);
    if (fileError) fields.file = fileError;
  } else if (data.file) {
    const fileError = validateFile(data.file);
    if (fileError) fields.file = fileError;
  }

  return fields;
}

/**
 * Converts a File into the file object that the mock stores.
 * @param {File} file
 * @returns {{ name: string, extension: string, mime: string, sizeBytes: number, url: string }}
 */
function fileFromFile(file) {
  return {
    name: file.name,
    extension: getExtension(file),
    mime: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    // Temporary URL: allows previewing what was just uploaded in the demo.
    url: URL.createObjectURL(file),
  };
}

/**
 * Simulates the progress of an upload so that the progress bar is visible.
 * @param {(percentage: number) => void} [onProgress]
 */
async function simulateProgress(onProgress) {
  const steps = [8, 22, 41, 58, 74, 88, 96, 100];

  for (const percentage of steps) {
    await waitForMock(140);
    onProgress?.(percentage);
  }
}

/**
 * Uploads a document to a repository. Only the repository owner can do it.
 * @param {DocumentData} data
 * @param {(percentage: number) => void} [onProgress]
 * @returns {Promise<object>}
 */
export async function uploadDocument(data, onProgress) {
  if (!USE_MOCK) {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('type', data.type);
    form.append('term', String(data.term));
    form.append('topic', data.topic);
    form.append('tags', JSON.stringify(data.tags ?? []));
    if (data.file) form.append('file', data.file);

    const { data: created } = await http.post(`/repositories/${data.repositoryId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    });

    return created;
  }

  await waitForMock(300);

  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para subir documentos.', { status: 401 });
  }

  const repository = store.repositories.find((item) => item.id === data.repositoryId);
  if (!repository) {
    throw new ApiError('El repositorio no existe o fue eliminado.', { status: 404 });
  }
  if (
    user.username !== repository.authorUsername &&
    !isAcceptedCollaborator(repository.id, user.username)
  ) {
    throw new ApiError('Solo el dueño del repositorio puede subir documentos.', {
      status: 403,
    });
  }

  const fields = validateDocument(data);
  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del documento.', { status: 400, fields });
  }

  await simulateProgress(onProgress);

  if (!data.file) {
    throw new ApiError('Selecciona el archivo que quieres subir.', { status: 400 });
  }

  const document = {
    id: nextId('document'),
    repositoryId: data.repositoryId,
    title: String(data.title).trim(),
    description: String(data.description).trim(),
    type: data.type,
    term: Number(data.term),
    topic: String(data.topic).trim(),
    tags: data.tags ?? [],
    file: fileFromFile(data.file),
    authorUsername: user.username,
    views: 0,
    downloads: 0,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  store.documents.unshift(document);
  notifyFollowersOfNewContent({
    authorUsername: user.username,
    title: `Nuevo documento de @${user.username}`,
    message: `@${user.username} subió "${document.title}" a ${repository.name}.`,
    targetUrl: `/documents/${document.id}`,
  });
  return enrich(document);
}

/**
 * Edits the data of a document. The file is optional.
 * @param {string} id
 * @param {DocumentData} data
 * @param {(percentage: number) => void} [onProgress]
 * @returns {Promise<object>}
 */
export async function updateDocument(id, data, onProgress) {
  if (!USE_MOCK) {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('type', data.type);
    form.append('term', String(data.term));
    form.append('topic', data.topic);
    form.append('tags', JSON.stringify(data.tags ?? []));
    if (data.file) form.append('file', data.file);

    const { data: updated } = await http.put(`/documents/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!event.total) return;
        onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    });

    return updated;
  }

  await waitForMock(300);

  const document = store.documents.find((item) => item.id === id);
  if (!document) {
    throw new ApiError('El documento no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user || user.username !== document.authorUsername) {
    throw new ApiError('Solo el autor puede editar este documento.', { status: 403 });
  }

  const fields = validateDocument(data, { requireFile: false });
  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del documento.', { status: 400, fields });
  }

  if (data.file) {
    await simulateProgress(onProgress);
    document.file = fileFromFile(data.file);
  }

  document.title = String(data.title).trim();
  document.description = String(data.description).trim();
  document.type = data.type;
  document.term = Number(data.term);
  document.topic = String(data.topic).trim();
  document.tags = data.tags ?? document.tags;

  return enrich(document);
}

/**
 * Deletes a document. Only the author can do it.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteDocument(id) {
  if (!USE_MOCK) {
    await http.delete(`/documents/${id}`);
    return;
  }

  await waitForMock();

  const index = store.documents.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new ApiError('El documento no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user || user.username !== store.documents[index].authorUsername) {
    throw new ApiError('Solo el autor puede eliminar este documento.', { status: 403 });
  }

  store.documents.splice(index, 1);
}

/**
 * Registers a download and returns the file URL.
 * @param {string} id
 * @returns {Promise<{ url: string, name: string }>}
 */
export async function downloadDocument(id) {
  if (!USE_MOCK) {
    const { data } = await http.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return { url: URL.createObjectURL(data), name: `documento-${id}` };
  }

  await waitForMock(200);

  const document = store.documents.find((item) => item.id === id);
  if (!document) {
    throw new ApiError('El documento no existe o fue eliminado.', { status: 404 });
  }

  document.downloads += 1;
  recordInteraction('download', document);

  return { url: document.file.url, name: document.file.name };
}

/**
 * Gives or removes the like of the session user.
 * @param {string} id
 * @returns {Promise<{ liked: boolean, likes: number }>}
 */
export async function toggleDocumentLike(id) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/documents/${id}/like`);
    return data;
  }

  await waitForMock(200);

  const document = store.documents.find((item) => item.id === id);
  if (!document) {
    throw new ApiError('El documento no existe o fue eliminado.', { status: 404 });
  }

  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para dar me gusta.', { status: 401 });
  }

  const key = likeKey(id, user.username);

  if (store.likedDocuments.has(key)) {
    store.likedDocuments.delete(key);
    document.likes = Math.max(0, document.likes - 1);
  } else {
    store.likedDocuments.add(key);
    document.likes += 1;
    recordInteraction('like', document);
    if (document.authorUsername !== user.username) {
      emitMockNotification({
        recipientUsername: document.authorUsername,
        type: 'like',
        title: 'Nuevo me gusta en tu documento',
        message: `A @${user.username} le gustó tu documento "${document.title}".`,
        targetUrl: `/documents/${document.id}`,
      });
    }
  }

  return { liked: store.likedDocuments.has(key), likes: document.likes };
}
