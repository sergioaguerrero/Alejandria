/**
 * @file catalogs.js
 * @description Closed lists used by the forms and the dialogs.
 * They come from the API contract (BE-15 and BE-27), so they live apart.
 */

/** Material types that can be published in a repository. */
export const MATERIAL_TYPES = [
  { value: 'apunte', label: 'Apunte' },
  { value: 'guia', label: 'Guía' },
  { value: 'resumen', label: 'Resumen' },
  { value: 'proyecto', label: 'Proyecto' },
];

/** Terms of the semester a document belongs to. */
export const TERMS = [
  { value: 1, label: 'Corte 1' },
  { value: 2, label: 'Corte 2' },
  { value: 3, label: 'Corte 3' },
];

/** Suggested tags for the document upload Autocomplete. */
export const SUGGESTED_TAGS = [
  'parcial',
  'taller',
  'quiz',
  'ejercicios',
  'laboratorio',
  'final',
  'repaso',
  'formulas',
  'algoritmos',
  'sql',
  'grafos',
  'poo',
];

/** Report reasons available in view 1 of moderation (FE-23). */
export const REPORT_REASONS = [
  { value: 'mal-etiquetado', label: 'Mal etiquetado' },
  { value: 'duplicado', label: 'Contenido duplicado' },
  { value: 'inapropiado', label: 'Contenido inapropiado' },
];

/** System roles. */
export const ROLES = {
  STUDENT: 'estudiante',
  ADMIN: 'admin',
};
