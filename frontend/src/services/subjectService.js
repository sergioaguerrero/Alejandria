/**
 * @file subjectService.js
 * @description Subject catalog (BE-03) and subjects of interest (FE-06).
 */

import { USE_MOCK, waitForMock } from './config.js';
import http from './http.js';
import { store } from '../mocks/store.js';

/**
 * Gets the subject catalog, optionally filtered by semester.
 * @param {{ semester?: number|string|null }} [filters]
 * @returns {Promise<object[]>}
 */
export async function getSubjects({ semester = null } = {}) {
  if (!USE_MOCK) {
    const { data } = await http.get('/subjects', { params: { semester } });
    return Array.isArray(data) ? data : data?.items ?? [];
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
