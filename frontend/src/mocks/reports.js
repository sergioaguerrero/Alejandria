/**
 * @file reports.js
 * @description Seed report fixtures (FE-23, FE-24, BE-27).
 */

/**
 * @typedef {'repository'|'document'|'profile'} ReportTargetType
 * @typedef {'pendiente'|'resuelto'} ReportStatus
 * @typedef {'descartado'|'ocultado'|'eliminado'|'advertencia'|'suspension'} ReportResolution
 *
 * @typedef {object} Report
 * @property {string} id
 * @property {ReportTargetType} targetType
 * @property {string} targetId
 * @property {string} targetLabel
 * @property {string} reason
 * @property {string} comment
 * @property {string} reporterUsername
 * @property {ReportStatus} status
 * @property {ReportResolution|null} resolution
 * @property {string|null} note
 * @property {string|null} resolvedAt
 * @property {string} createdAt
 */

/** @type {Report[]} */
export const REPORTS = [
  {
    id: 'report-001',
    targetType: 'document',
    targetId: 'doc-002',
    targetLabel: 'Taller 1 - Complejidad asintótica y Big-O',
    reason: 'mal-etiquetado',
    comment: 'El documento fue subido al corte 1 pero corresponde al corte 2.',
    reporterUsername: 'andrespineda',
    status: 'pendiente',
    resolution: null,
    note: null,
    resolvedAt: null,
    createdAt: '2026-10-28T10:15:00.000Z',
  },
  {
    id: 'report-002',
    targetType: 'repository',
    targetId: 'repo-003',
    targetLabel: 'Bases de Datos - Relacional y SQL',
    reason: 'duplicado',
    comment: 'Existe otro repositorio con los mismos apuntes y ejercicios resueltos.',
    reporterUsername: 'lauramartinez',
    status: 'pendiente',
    resolution: null,
    note: null,
    resolvedAt: null,
    createdAt: '2026-10-27T16:40:00.000Z',
  },
  {
    id: 'report-003',
    targetType: 'profile',
    targetId: 'camilodaza',
    targetLabel: '@camilodaza',
    reason: 'inapropiado',
    comment: 'El perfil contiene descripciones no académicas.',
    reporterUsername: 'valentinarojas',
    status: 'pendiente',
    resolution: null,
    note: null,
    resolvedAt: null,
    createdAt: '2026-10-26T12:00:00.000Z',
  },
  {
    id: 'report-004',
    targetType: 'document',
    targetId: 'doc-001',
    targetLabel: 'Guía práctica de árboles binarios y AVL',
    reason: 'mal-etiquetado',
    comment: 'Faltaban etiquetas de corte.',
    reporterUsername: 'danielaospino',
    status: 'resuelto',
    resolution: 'descartado',
    note: 'El documento cuenta con las etiquetas correctas.',
    resolvedAt: '2026-10-25T15:30:00.000Z',
    createdAt: '2026-10-24T09:00:00.000Z',
  },
  {
    id: 'report-005',
    targetType: 'document',
    targetId: 'doc-003',
    targetLabel: 'Proyecto Final - Minishell en C',
    reason: 'duplicado',
    comment: 'Copia exacta de una entrega anterior.',
    reporterUsername: 'sergioaguerrero',
    status: 'resuelto',
    resolution: 'ocultado',
    note: 'Ocultado temporalmente mientras se verifica con el docente.',
    resolvedAt: '2026-10-26T14:00:00.000Z',
    createdAt: '2026-10-25T08:20:00.000Z',
  },
  {
    id: 'report-006',
    targetType: 'document',
    targetId: 'doc-004',
    targetLabel: 'Parcial 2 — Consultas SQL y Transacciones (En curso)',
    reason: 'examen-vigente',
    comment: 'Contiene enunciados de una evaluación que se está aplicando esta semana.',
    reporterUsername: 'lauramartinez',
    status: 'pendiente',
    createdAt: '2026-10-29T12:15:00.000Z',
  },
  {
    id: 'report-007',
    targetType: 'document',
    targetId: 'doc-005',
    targetLabel: 'Guía de Diseño y Normalización sin Referencias',
    reason: 'plagio',
    comment: 'Copia textual de apuntes de otro compañero sin acreditar autoría.',
    reporterUsername: 'valentinarojas',
    status: 'pendiente',
    createdAt: '2026-10-29T13:40:00.000Z',
  },
];
