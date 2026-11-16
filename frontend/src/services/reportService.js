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

/**
 * Lists reports filtered by status and optional reason. Admin only.
 * @param {object} [filters]
 * @param {'pendiente'|'resuelto'} [filters.status]
 * @param {string} [filters.reason]
 * @returns {Promise<object[]>}
 */
export async function getReports(filters = {}) {
  const user = currentUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden consultar la bandeja de reportes.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    let result = [...store.reports];
    if (filters.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.reason && filters.reason !== 'todos') {
      result = result.filter((r) => r.reason === filters.reason);
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return JSON.parse(JSON.stringify(result));
  }

  const response = await http.get('/admin/reports', { params: filters });
  return response.data;
}

/**
 * Returns a report by its id with enriched target data and author.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getReportById(id) {
  const user = currentUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden consultar el detalle de un reporte.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    const report = store.reports.find((r) => r.id === id);
    if (!report) {
      throw new ApiError('Reporte no encontrado.', { status: 404 });
    }

    let targetData = null;
    let author = null;

    if (report.targetType === 'document') {
      const doc = store.documents.find((d) => d.id === report.targetId);
      if (doc) {
        targetData = { ...doc };
        author = store.users.find((u) => u.username === doc.authorUsername) || null;
      }
    } else if (report.targetType === 'repository') {
      const repo = store.repositories.find((r) => r.id === report.targetId);
      if (repo) {
        targetData = { ...repo };
        author = store.users.find((u) => u.username === repo.authorUsername) || null;
      }
    } else if (report.targetType === 'profile') {
      const profileUser = store.users.find((u) => u.username === report.targetId);
      if (profileUser) {
        targetData = { ...profileUser };
        author = profileUser;
      }
    }

    return {
      ...report,
      targetData,
      author: author
        ? {
            id: author.id,
            username: author.username,
            name: author.name,
            email: author.email,
            suspended: Boolean(author.suspended),
          }
        : null,
    };
  }

  const response = await http.get(`/admin/reports/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Resolves a report with an action and note.
 * @param {string} id
 * @param {{ action: 'descartado'|'ocultado'|'eliminado'|'advertencia'|'suspension', note?: string }} resolution
 * @returns {Promise<object>}
 */
export async function resolveReport(id, { action, note = '' }) {
  const admin = currentUser();
  if (!admin || admin.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden resolver reportes.', { status: 403 });
  }

  const validActions = ['descartado', 'ocultado', 'eliminado', 'advertencia', 'suspension'];
  if (!validActions.includes(action)) {
    throw new ApiError('Acción de resolución inválida.', { status: 400 });
  }

  if (USE_MOCK) {
    await waitForMock();
    const report = store.reports.find((r) => r.id === id);
    if (!report) {
      throw new ApiError('Reporte no encontrado.', { status: 404 });
    }

    report.status = 'resuelto';
    report.resolution = action;
    report.note = String(note || '').trim() || null;
    report.resolvedAt = new Date().toISOString();

    let authorUsername = '';
    if (report.targetType === 'document') {
      const doc = store.documents.find((d) => d.id === report.targetId);
      if (doc) {
        authorUsername = doc.authorUsername;
        if (action === 'ocultado') {
          doc.hidden = true;
        } else if (action === 'eliminado') {
          doc.deleted = true;
          const idx = store.documents.findIndex((d) => d.id === report.targetId);
          if (idx !== -1) store.documents.splice(idx, 1);
        }
      }
    } else if (report.targetType === 'repository') {
      const repo = store.repositories.find((r) => r.id === report.targetId);
      if (repo) {
        authorUsername = repo.authorUsername;
        if (action === 'eliminado') {
          const idx = store.repositories.findIndex((r) => r.id === report.targetId);
          if (idx !== -1) store.repositories.splice(idx, 1);
        }
      }
    } else if (report.targetType === 'profile') {
      authorUsername = report.targetId;
    }

    const authorUser = store.users.find((u) => u.username === authorUsername);

    if (authorUser && (action === 'advertencia' || action === 'suspension')) {
      store.counters.sanction += 1;
      const sanctionEntry = {
        id: `sanc-${String(store.counters.sanction).padStart(3, '0')}`,
        userId: authorUser.id,
        type: action,
        reason: `Reporte ${report.id}: ${report.reason}`,
        note: String(note || '').trim(),
        adminUsername: admin.username,
        createdAt: new Date().toISOString(),
      };
      store.sanctions.unshift(sanctionEntry);

      if (action === 'suspension') {
        authorUser.suspended = true;
      }

      store.counters.notification += 1;
      store.notifications.unshift({
        id: `notif-${String(store.counters.notification).padStart(3, '0')}`,
        userId: authorUser.id,
        type: action === 'suspension' ? 'sanction' : 'warning',
        title: action === 'suspension' ? 'Cuenta suspendida' : 'Advertencia de moderación',
        message: note || `Se ha aplicado una medida de ${action} sobre tu contenido reportado.`,
        targetUrl: '/terms',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { ...report };
  }

  const response = await http.post(`/admin/reports/${encodeURIComponent(id)}/resolve`, {
    action,
    note,
  });
  return response.data;
}
