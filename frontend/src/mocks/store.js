/**
 * @file store.js
 * @description In-memory state of the example data.
 *
 * The original mocks are constants; here they are cloned only once at
 * startup so that the demo actions (like, create repository, upload
 * document) are reflected on screen even if the module is reloaded.
 *
 * When the page is reloaded the state returns to the initial data: it is a mock.
 */

import { DOCUMENTS } from './documents.js';
import { NOTIFICATIONS } from './notifications.js';
import { SUBJECTS } from './subjects.js';
import { REPOSITORIES } from './repositories.js';
import { USERS } from './users.js';

/** Deep clones flat data (objects, arrays, primitives). */
const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * Counters to generate new ids with the same format as the mocks.
 * @returns {{ users: object[], repositories: object[], documents: object[], subjects: object[], reports: object[], likedRepositories: Set<string>, likedDocuments: Set<string>, counters: { repository: number, document: number, user: number, report: number } }}
 */
function createInitialState() {
  return {
    users: clone(USERS),
    repositories: clone(REPOSITORIES),
    documents: clone(DOCUMENTS),
    subjects: clone(SUBJECTS),
    /** Keys with format `repositoryId::username`. */
    likedRepositories: new Set(),
    /** Keys with format `documentId::username`. */
    likedDocuments: new Set(),
    /** Ids of the subjects marked by the user (FE-06). */
    subjectsOfInterest: /** @type {number[]} */ ([]),
    /** Reports of content sent by the students (FE-23, FE-24). */
    reports: /** @type {object[]} */ ([]),
    /** Notifications for the users (FE-18, FE-19). */
    notifications: clone(NOTIFICATIONS),
    counters: {
      repository: REPOSITORIES.length,
      document: DOCUMENTS.length,
      user: USERS.length,
      report: 0,
      notification: NOTIFICATIONS.length,
    },
  };
}

/** Mutable state shared by all services in mock mode. */
export const store = createInitialState();

/** Returns the state to the original data. */
export function resetStore() {
  Object.assign(store, createInitialState());
}

/**
 * Generates the next id of an entity, for example `repository-011`.
 * @param {'repository'|'document'|'user'} entity
 * @returns {string}
 */
export function nextId(entity) {
  store.counters[entity] += 1;
  const number = String(store.counters[entity]).padStart(3, '0');
  return `${entity}-${number}`;
}
