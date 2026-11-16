/**
 * @file index.js
 * @description Entry point of the example data (FE-02).
 *
 * Import from here to avoid depending on the internal paths:
 *   import { REPOSITORIES, SUBJECTS } from '../mocks';
 */

export { SUBJECTS } from './subjects.js';
export { USERS } from './users.js';
export { REPOSITORIES } from './repositories.js';
export { DOCUMENTS } from './documents.js';
export {
  MATERIAL_TYPES,
  TERMS,
  SUGGESTED_TAGS,
  REPORT_REASONS,
  ROLES,
} from './catalogs.js';
export { store, resetStore, nextId } from './store.js';
