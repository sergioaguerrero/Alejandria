/**
 * @file catalogos.js
 * @description Listas cerradas que usan los formularios y los diálogos.
 * Salen del contrato de la API (BE-15 y BE-27), por eso viven aparte.
 */

/** Tipos de material que se pueden publicar en un repositorio. */
export const TIPOS_MATERIAL = [
  { valor: 'apunte', etiqueta: 'Apunte' },
  { valor: 'guia', etiqueta: 'Guía' },
  { valor: 'resumen', etiqueta: 'Resumen' },
  { valor: 'proyecto', etiqueta: 'Proyecto' },
];

/** Cortes del semestre a los que pertenece un documento. */
export const CORTES = [
  { valor: 1, etiqueta: 'Corte 1' },
  { valor: 2, etiqueta: 'Corte 2' },
  { valor: 3, etiqueta: 'Corte 3' },
];

/** Etiquetas sugeridas para el Autocomplete de subida de documentos. */
export const ETIQUETAS_SUGERIDAS = [
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

/** Motivos de reporte disponibles en la vista 1 de moderación (FE-23). */
export const MOTIVOS_REPORTE = [
  { valor: 'mal-etiquetado', etiqueta: 'Mal etiquetado' },
  { valor: 'duplicado', etiqueta: 'Contenido duplicado' },
  { valor: 'inapropiado', etiqueta: 'Contenido inapropiado' },
];

/** Roles del sistema. */
export const ROLES = {
  ESTUDIANTE: 'estudiante',
  ADMIN: 'admin',
};
