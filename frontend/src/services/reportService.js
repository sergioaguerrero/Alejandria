/**
 * @file reportService.js
 * @description Reports of content (FE-23, view 1 of moderation).
 *
 * A student can report a repository, a document or a public profile with one of
 * the reasons of the catalog and an optional comment. The admin inbox (views 22
 * and 23) reads and resolves them later.
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { nextId, store } from '../mocks/store.js';
import { currentUser } from './authService.js';
import { REPORT_REASONS } from '../mocks/catalogs.js';

/**
 * @typedef {'repository'|'document'|'profile'} ReportTargetType
 */

/**
 * @typedef {object} ReportData
 * @property {ReportTargetType} targetType
 * @property {string} targetId  Repository/document id, or the username of the profile.
 * @property {string} targetLabel  Name shown in the admin inbox.
 * @property {string} reason  Value of the REPORT_REASONS catalog.
 * @property {string} [comment]
 */

/**
 * Reports a piece of content.
 * @param {ReportData} data
 * @returns {Promise<object>} The created report.
 * @throws {ApiError} 400 with `fields` if the reason is missing, 401 without session,
 *   409 if the same user already reported it and it is still pending.
 */
export async function createReport(data) {
  const targetType = data.targetType;
  const targetId = String(data.targetId ?? '').trim();
  const reason = data.reason;
  const comment = String(data.comment ?? '').trim();

  if (!targetType || !targetId) {
    throw new ApiError('No se pudo identificar el contenido que quieres reportar.', {
      status: 400,
    });
  }

  if (!REPORT_REASONS.some((option) => option.value === reason)) {
    throw new ApiError('Selecciona el motivo del reporte.', {
      status: 400,
      fields: { reason: 'Selecciona el motivo del reporte.' },
    });
  }

  if (!USE_MOCK) {
    const { data: created } = await http.post('/reports', {
      targetType,
      targetId,
      reason,
      comment,
    });
    return created;
  }

  await waitForMock();

  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para enviar un reporte.', { status: 401 });
  }

  const duplicated = store.reports.some(
    (report) =>
      report.status === 'pendiente' &&
      report.targetType === targetType &&
      report.targetId === targetId &&
      report.reporterUsername === user.username,
  );

  if (duplicated) {
    throw new ApiError('Ya reportaste este contenido. El equipo de administración lo revisará.', {
      status: 409,
    });
  }

  const report = {
    id: nextId('report'),
    targetType,
    targetId,
    targetLabel: String(data.targetLabel ?? targetId),
    reason,
    comment,
    reporterUsername: user.username,
    status: 'pendiente',
    resolution: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
  };

  store.reports.unshift(report);
  return { ...report };
}
