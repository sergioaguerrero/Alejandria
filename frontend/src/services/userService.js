/**
 * @file userService.js
 * @description Public data of the users (FE-13, view 16, endpoint BE-14).
 *
 * The public profile only exposes the username: the email and the full name
 * stay private.
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';

/**
 * @typedef {object} PublicProfile
 * @property {string} username
 */

/**
 * Gets the public data of a user.
 * @param {string} username
 * @returns {Promise<PublicProfile>}
 * @throws {ApiError} 404 if the user does not exist.
 */
export async function getPublicProfile(username) {
  const cleanUsername = String(username ?? '').trim().toLowerCase();

  if (!cleanUsername) {
    throw new ApiError('El usuario no existe.', { status: 404 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get(`/users/${cleanUsername}`);
    return data;
  }

  await waitForMock();

  const user = store.users.find((candidate) => candidate.username === cleanUsername);

  if (!user) {
    throw new ApiError('El usuario no existe.', { status: 404 });
  }

  return { username: user.username };
}

/**
 * Gets administrative user detail including sanctions history. Admin only (FE-24, BE-28).
 * @param {string} userId User id (e.g. 'usr-001') or username.
 * @returns {Promise<object>}
 */
export async function getAdminUser(userId) {
  const admin = currentUser();
  if (!admin || admin.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden consultar la información de gestión de usuarios.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    const user = store.users.find((u) => u.id === userId || u.username === userId);
    if (!user) {
      throw new ApiError('Usuario no encontrado.', { status: 404 });
    }

    const sanctions = store.sanctions
      .filter((s) => s.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const repositoriesCount = store.repositories.filter((r) => r.authorUsername === user.username).length;
    const documentsCount = store.documents.filter((d) => d.authorUsername === user.username).length;

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      semester: user.semester,
      role: user.role,
      suspended: Boolean(user.suspended),
      sanctions,
      repositoriesCount,
      documentsCount,
    };
  }

  const response = await http.get(`/api/admin/users/${encodeURIComponent(userId)}`);
  return response.data;
}

/**
 * Toggles a user's account suspension. Admin only (FE-24, BE-28).
 * @param {string} userId
 * @param {{ reason?: string }} options
 * @returns {Promise<object>}
 */
export async function toggleUserSuspension(userId, { reason = '' } = {}) {
  const admin = currentUser();
  if (!admin || admin.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden suspender o reactivar cuentas.', {
      status: 403,
    });
  }

  if (USE_MOCK) {
    await waitForMock();
    const user = store.users.find((u) => u.id === userId || u.username === userId);
    if (!user) {
      throw new ApiError('Usuario no encontrado.', { status: 404 });
    }

    const nextSuspended = !user.suspended;
    user.suspended = nextSuspended;

    store.counters.sanction += 1;
    const record = {
      id: `sanc-${String(store.counters.sanction).padStart(3, '0')}`,
      userId: user.id,
      type: nextSuspended ? 'suspension' : 'reactivacion',
      reason: reason || (nextSuspended ? 'Suspensión manual por administrador' : 'Reactivación de cuenta'),
      note: reason || null,
      adminUsername: admin.username,
      createdAt: new Date().toISOString(),
    };
    store.sanctions.unshift(record);

    store.counters.notification += 1;
    store.notifications.unshift({
      id: `notif-${String(store.counters.notification).padStart(3, '0')}`,
      userId: user.id,
      type: nextSuspended ? 'sanction' : 'system',
      title: nextSuspended ? 'Cuenta suspendida' : 'Cuenta reactivada',
      message: nextSuspended
        ? `Tu cuenta ha sido suspendida. Motivo: ${reason || 'Infracción de normas'}.`
        : 'Tu cuenta ha sido reactivada por el equipo de administración.',
      targetUrl: '/terms',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return {
      id: user.id,
      username: user.username,
      suspended: user.suspended,
    };
  }

  const response = await http.post(`/api/admin/users/${encodeURIComponent(userId)}/toggle-suspension`, {
    reason,
  });
  return response.data;
}
