/**
 * @file index.js
 * @description Entry point of the services layer (FE-02).
 *
 * Screens import from here:
 *   import { getRepositories } from '../services';
 *
 * So, if tomorrow a service is split into several files, the screens
 * do not notice.
 */

export { USE_MOCK, API_URL } from './config.js';
export { ApiError, normalizeError } from './errors.js';
export { default as http } from './http.js';

export {
  login,
  register,
  logout,
  saveSession,
  getCurrentSession,
  currentUser,
} from './authService.js';

export {
  getRepositories,
  getRepository,
  getRepositoriesByUser,
  createRepository,
  updateRepository,
  deleteRepository,
  toggleRepositoryLike,
} from './repositoryService.js';

export {
  listByRepository,
  getDocument,
  getDocumentsByUser,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  toggleDocumentLike,
} from './documentService.js';

export {
  getSubjects,
  groupBySemester,
  getSubjectsOfInterest,
  updateSubjectsOfInterest,
} from './subjectService.js';

export { getMyStatistics } from './statisticsService.js';
