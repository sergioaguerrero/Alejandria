/**
 * @file subjectService.js
 * @description Subject catalog (BE-03) and subjects of interest (FE-06).
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { currentUser } from './authService.js';
import { store } from '../mocks/store.js';

/** @type {Map<string, Promise<object[]>>} */
const subjectsCache = new Map();

/**
 * Gets the subject catalog, optionally filtered by semester.
 * Caches the catalog in memory so switching pages does not hit the backend again.
 * @param {{ semester?: number|string|null }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getSubjects({ semester = null } = {}) {
  if (!USE_MOCK) {
    const cacheKey = semester ? String(semester) : '__ALL__';
    if (subjectsCache.has(cacheKey)) {
      return subjectsCache.get(cacheKey);
    }
    const request = http
      .get('/subjects', { params: { semester } })
      .then(({ data }) => (Array.isArray(data) ? data : data?.items ?? []))
      .catch((err) => {
        subjectsCache.delete(cacheKey);
        throw err;
      });
    subjectsCache.set(cacheKey, request);
    return request;
  }

  await waitForMock();

  return store.subjects
    .filter((subject) => !semester || subject.semester === Number(semester))
    .sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name, 'es'));
}

/**
 * Groups a list of subjects by semester.
 * @param {object[]} subjects
 * @returns {Array<{ semester: number, subjects: object[] }>}
 */
export function groupBySemester(subjects) {
  /** @type {Map<number, object[]>} */
  const groups = new Map();

  for (const subject of subjects) {
    if (!groups.has(subject.semester)) {
      groups.set(subject.semester, []);
    }
    groups.get(subject.semester)?.push(subject);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semester, list]) => ({ semester, subjects: list }));
}

/**
 * Gets the subjects of interest of the session user (FE-06).
 * @returns {Promise<number[]>} Ids of the selected subjects.
 */
export async function getSubjectsOfInterest() {
  if (!USE_MOCK) {
    const { data } = await http.get('/users/me/subjects');
    return (Array.isArray(data) ? data : data?.items ?? []).map((subject) => subject.id);
  }

  await waitForMock(200);

  return [...store.subjectsOfInterest];
}

/**
 * Saves the subjects of interest of the session user (FE-06).
 * @param {number[]} subjectIds
 * @returns {Promise<void>}
 */
export async function updateSubjectsOfInterest(subjectIds) {
  if (!USE_MOCK) {
    await http.put('/users/me/subjects', { subjectIds });
    return;
  }

  await waitForMock();

  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para guardar tus materias.', { status: 401 });
  }

  const catalogIds = new Set(store.subjects.map((subject) => subject.id));
  store.subjectsOfInterest = [...new Set(subjectIds.map(Number))].filter((id) =>
    catalogIds.has(id),
  );
}
