/**
 * @file aiContentMeta.js
 * @description Shared catalog and helpers for AI-generated study content types (FE-34, BE-37).
 */

export const AI_CONTENT_TYPES = [
  {
    value: 'quiz',
    label: 'Cuestionario',
    shortLabel: 'Cuestionario',
    colorKey: 'primary',
    description: 'Preguntas tipo examen con respuestas justificadas y puntaje.',
    generatingTitle: 'Generando cuestionario con IA...',
    generatingSubtitle:
      'Procesando apuntes, extrayendo conceptos clave y formulando preguntas con sus respectivas explicaciones.',
    submitLabel: 'Generar cuestionario con IA',
    downloadPdfLabel: 'Descargar cuestionario en formato PDF',
  },
  {
    value: 'summary',
    label: 'Resumen',
    shortLabel: 'Resumen',
    colorKey: 'info',
    description: 'Síntesis estructurada por secciones, ideas clave y glosario.',
    generatingTitle: 'Generando resumen con IA...',
    generatingSubtitle:
      'Sintetizando ideas principales, definiciones esenciales y conclusiones clave de los apuntes seleccionados.',
    submitLabel: 'Generar resumen con IA',
    downloadPdfLabel: 'Descargar resumen en formato PDF',
  },
  {
    value: 'guide',
    label: 'Guía de estudio',
    shortLabel: 'Guía',
    colorKey: 'success',
    description: 'Ruta paso a paso con objetivos, ejercicios guía y checklist.',
    generatingTitle: 'Generando guía de estudio con IA...',
    generatingSubtitle:
      'Organizando objetivos de aprendizaje, módulos de repaso, preguntas prácticas y lista de verificación.',
    submitLabel: 'Generar guía de estudio con IA',
    downloadPdfLabel: 'Descargar guía en formato PDF',
  },
  {
    value: 'slides',
    label: 'Diapositivas',
    shortLabel: 'Diapositivas',
    colorKey: 'warning',
    description: 'Presentación visual por láminas lista para exponer o repasar.',
    generatingTitle: 'Generando diapositivas con IA...',
    generatingSubtitle:
      'Estructurando láminas visuales con puntos clave, mensajes resumen y notas de exposición.',
    submitLabel: 'Generar diapositivas con IA',
    downloadPdfLabel: 'Descargar diapositivas en formato PDF',
  },
];

const META_BY_TYPE = Object.fromEntries(AI_CONTENT_TYPES.map((item) => [item.value, item]));

/**
 * Returns metadata for an AI content type, defaulting to `'quiz'`.
 * @param {string} [contentType='quiz']
 */
export function getAiContentMeta(contentType = 'quiz') {
  return META_BY_TYPE[contentType] || META_BY_TYPE.quiz;
}

/**
 * Resolves the route path for viewing an AI study material.
 * @param {object} material
 * @returns {string}
 */
export function getAiMaterialRoute(material) {
  if (!material?.id) return '/ai';
  return material.contentType && material.contentType !== 'quiz'
    ? `/ai/material/${material.id}`
    : `/ai/quiz/${material.id}`;
}

/**
 * Builds a concise unit count summary string for cards (e.g., "5 preguntas", "6 diapositivas").
 * @param {object} material
 * @returns {string}
 */
export function getAiMaterialUnitLabel(material) {
  const type = material?.contentType || 'quiz';
  if (type === 'summary') {
    const count = material?.sections?.length ?? 3;
    return `${count} secciones • ${material?.estimatedReadMinutes ?? 6} min lectura`;
  }
  if (type === 'guide') {
    const count = material?.modules?.length ?? 3;
    return `${count} módulos de estudio`;
  }
  if (type === 'slides') {
    const count = material?.slides?.length ?? 5;
    return `${count} diapositivas`;
  }
  const count = material?.questions?.length ?? 5;
  return `${count} preguntas`;
}
