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
import { AI_MATERIALS } from './aiMaterials.js';
import { QUIZZES } from './quizzes.js';
import { REPORTS } from './reports.js';
import { SUBJECTS } from './subjects.js';
import { REPOSITORIES } from './repositories.js';
import { USERS } from './users.js';

/** Deep clones flat data (objects, arrays, primitives). */
const clone = (value) => JSON.parse(JSON.stringify(value));

/**
 * Counters to generate new ids with the same format as the mocks.
 * @returns {{ users: object[], repositories: object[], documents: object[], subjects: object[], reports: object[], likedRepositories: Set<string>, counters: { repository: number, document: number, user: number, report: number } }}
 */
function createInitialState() {
  return {
    users: clone(USERS),
    repositories: clone(REPOSITORIES),
    documents: clone(DOCUMENTS),
    subjects: clone(SUBJECTS),
    /** Keys with format `repositoryId::username`. */
    likedRepositories: new Set(),
    /** Keys with format `repositoryId::username` for followed/subscribed repositories. */
    followedRepositories: new Set([
      'repository-001::lauramartinez',
      'repository-001::valentinarojas',
      'repository-001::andrespineda',
      'repository-002::sergioaguerrero',
      'repository-002::andrespineda',
      'repository-002::camilodaza',
      'repository-002::valentinarojas',
    ]),
    /** Keys with format `followerUsername::targetUsername` (FE-32). */
    userFollows: new Set([
      'sergioaguerrero::lauramartinez',
      'lauramartinez::sergioaguerrero',
      'sergioaguerrero::valentinarojas',
      'valentinarojas::sergioaguerrero',
      'sergioaguerrero::andrespineda',
      'danielaospino::sergioaguerrero',
      'lauramartinez::andrespineda',
      'andrespineda::lauramartinez',
    ]),
    /** Ids of the subjects marked by the user (FE-06). */
    subjectsOfInterest: /** @type {number[]} */ ([]),
    /** User interactions (views, downloads, likes) for statistics (FE-25, FE-27, BE-21). */
    interactions: /** @type {object[]} */ ([]),
    /** Password reset tokens generated in mock mode (FE-08, BE-10). */
    resetTokens: new Map(),
    /** Email verification OTP codes generated in mock mode. */
    verificationCodes: new Map(),
    /** AI-generated quizzes (FE-20, FE-21, FE-22, BE-35, BE-36). */
    quizzes: clone(QUIZZES),
    /** AI-generated summaries, study guides, and presentation slides (FE-34, BE-37). */
    aiMaterials: clone(AI_MATERIALS),
    /** Repository collaborators and pending invitations (FE-35, BE-43). */
    repositoryCollaborators: [
      {
        id: 'collab-001',
        repositoryId: 'repository-001',
        username: 'lauramartinez',
        status: 'aceptado',
        invitedBy: 'sergioaguerrero',
        createdAt: '2026-10-20T12:00:00.000Z',
        respondedAt: '2026-10-20T14:00:00.000Z',
      },
      {
        id: 'collab-002',
        repositoryId: 'repository-001',
        username: 'valentinarojas',
        status: 'pendiente',
        invitedBy: 'sergioaguerrero',
        createdAt: '2026-10-28T09:00:00.000Z',
      },
      {
        id: 'collab-003',
        repositoryId: 'repository-002',
        username: 'sergioaguerrero',
        status: 'pendiente',
        invitedBy: 'lauramartinez',
        createdAt: '2026-10-29T10:00:00.000Z',
      },
    ],
    /** AI materials shared exclusively between mutual friends (FE-33, BE-38). */
    aiShares: [
      {
        id: 'share-001',
        materialId: 'quiz-002',
        senderUsername: 'lauramartinez',
        recipientUsername: 'sergioaguerrero',
        note: 'Te comparto este quiz de 3FN y SQL para repasar el parcial.',
        createdAt: '2026-10-29T09:45:00.000Z',
      },
    ],
    /** Count of daily AI generations consumed today by user id. */
    aiGenerationsToday: new Map(),
    /** Reports of content sent by the students (FE-23, FE-24). */
    reports: clone(REPORTS),
    /** Notifications for the users (FE-18, FE-19). */
    notifications: clone(NOTIFICATIONS),
    /** Sanctions and warnings issued to users (FE-24, BE-28). */
    sanctions: [
      {
        id: 'sanc-001',
        userId: 'usr-005',
        type: 'advertencia',
        reason: 'Contenido inapropiado reportado en perfil',
        note: 'Se solicita al estudiante remover enlaces externos no académicos.',
        adminUsername: 'admin',
        createdAt: '2026-10-25T14:00:00.000Z',
      },
    ],
    /** Municipal-free search query logs for admin analytics (FE-37, BE-25). */
    searchLogs: [
      { term: 'árboles avl', count: 64, lastSearchedAt: '2026-10-29T16:20:00.000Z' },
      { term: 'normalización 3fn', count: 52, lastSearchedAt: '2026-10-29T14:10:00.000Z' },
      { term: 'grafos bfs', count: 47, lastSearchedAt: '2026-10-29T11:30:00.000Z' },
      { term: 'cálculo integral', count: 39, lastSearchedAt: '2026-10-28T19:05:00.000Z' },
      { term: 'sql joins', count: 35, lastSearchedAt: '2026-10-28T15:40:00.000Z' },
      { term: 'patrones de diseño', count: 29, lastSearchedAt: '2026-10-27T17:15:00.000Z' },
      { term: 'ecuaciones diferenciales', count: 24, lastSearchedAt: '2026-10-26T10:50:00.000Z' },
      { term: 'programación dinámica', count: 21, lastSearchedAt: '2026-10-25T20:00:00.000Z' },
    ],
    /** Historical and live AI generation events for admin analytics (FE-37, BE-25). */
    aiUsageLogs: [
      { id: 'ailog-01', username: 'sergioaguerrero', repositoryId: 'repository-001', contentType: 'quiz', scope: 'all', periodBucket: 'day', createdAt: '2026-10-29T10:15:00.000Z' },
      { id: 'ailog-02', username: 'lauramartinez', repositoryId: 'repository-002', contentType: 'slides', scope: 'topic', periodBucket: 'day', createdAt: '2026-10-29T11:45:00.000Z' },
      { id: 'ailog-03', username: 'valentinarojas', repositoryId: 'repository-001', contentType: 'summary', scope: 'term', periodBucket: 'day', createdAt: '2026-10-29T13:20:00.000Z' },
      { id: 'ailog-04', username: 'andrespineda', repositoryId: 'repository-002', contentType: 'guide', scope: 'all', periodBucket: 'week', createdAt: '2026-10-27T09:10:00.000Z' },
      { id: 'ailog-05', username: 'sergioaguerrero', repositoryId: 'repository-001', contentType: 'summary', scope: 'all', periodBucket: 'week', createdAt: '2026-10-26T18:30:00.000Z' },
      { id: 'ailog-06', username: 'danielaospino', repositoryId: 'repository-003', contentType: 'quiz', scope: 'term', periodBucket: 'week', createdAt: '2026-10-25T16:00:00.000Z' },
      { id: 'ailog-07', username: 'lauramartinez', repositoryId: 'repository-002', contentType: 'quiz', scope: 'all', periodBucket: 'week', createdAt: '2026-10-24T12:15:00.000Z' },
      { id: 'ailog-08', username: 'camilodaza', repositoryId: 'repository-001', contentType: 'guide', scope: 'tag', periodBucket: 'month', createdAt: '2026-10-18T14:40:00.000Z' },
      { id: 'ailog-09', username: 'valentinarojas', repositoryId: 'repository-003', contentType: 'slides', scope: 'topic', periodBucket: 'month', createdAt: '2026-10-15T19:20:00.000Z' },
      { id: 'ailog-10', username: 'andrespineda', repositoryId: 'repository-002', contentType: 'summary', scope: 'all', periodBucket: 'month', createdAt: '2026-10-12T10:05:00.000Z' },
    ],
    _lastRecordedSearch: { term: '', ts: 0 },
    counters: {
      repository: REPOSITORIES.length,
      document: DOCUMENTS.length,
      user: USERS.length,
      report: REPORTS.length,
      notification: NOTIFICATIONS.length,
      sanction: 1,
      quiz: QUIZZES.length,
      aiMaterial: AI_MATERIALS.length,
      collaborator: 3,
      aiShare: 1,
    },
  };
}

/** Mutable state shared by all services in mock mode. */
export const store = createInitialState();

/** Records a normalized search term into in-memory analytics (debounced for paired queries). */
export function recordMockSearchTerm(rawQuery) {
  const clean = String(rawQuery || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (clean.length < 2) return;

  const now = Date.now();
  if (store._lastRecordedSearch?.term === clean && now - store._lastRecordedSearch.ts < 1200) {
    return;
  }
  store._lastRecordedSearch = { term: clean, ts: now };

  store.searchLogs = store.searchLogs || [];
  const existing = store.searchLogs.find((item) => item.term.toLowerCase() === clean);
  if (existing) {
    existing.count += 1;
    existing.lastSearchedAt = new Date().toISOString();
  } else {
    store.searchLogs.unshift({
      term: clean,
      count: 1,
      lastSearchedAt: new Date().toISOString(),
    });
  }
}

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
