/**
 * @file notificationService.js
 * @description Notifications service (FE-18, FE-19, BE-31, BE-32).
 *
 * Provides operations to list notifications, get unread count,
 * and mark single or all notifications as read.
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';

/**
 * Returns all notifications for the current user, sorted newest first.
 * @returns {Promise<object[]>}
 */
export async function getNotifications() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para ver tus notificaciones.', { status: 401 });
  }

  if (USE_MOCK) {
    await waitForMock();
    const list = store.notifications
      .filter((notification) => notification.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return JSON.parse(JSON.stringify(list));
  }

  const response = await http.get('/api/notifications');
  return response.data;
}

/**
 * Returns the number of unread notifications for the current user.
 * @returns {Promise<number>}
 */
export async function getUnreadNotificationsCount() {
  const user = currentUser();
  if (!user) {
    return 0;
  }

  if (USE_MOCK) {
    await waitForMock();
    return store.notifications.filter(
      (notification) => notification.userId === user.id && !notification.read,
    ).length;
  }

  const response = await http.get('/api/notifications/unread-count');
  return response.data.count;
}

/**
 * Marks a notification as read.
 * @param {string} notificationId
 * @returns {Promise<{ success: boolean }>}
 */
export async function markNotificationAsRead(notificationId) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para realizar esta acción.', { status: 401 });
  }

  if (USE_MOCK) {
    await waitForMock();
    const target = store.notifications.find(
      (notification) => notification.id === notificationId && notification.userId === user.id,
    );
    if (!target) {
      throw new ApiError('Notificación no encontrada.', { status: 404 });
    }
    target.read = true;
    return { success: true };
  }

  const response = await http.put(`/api/notifications/${encodeURIComponent(notificationId)}/read`);
  return response.data;
}

/**
 * Marks all notifications of the current user as read.
 * @returns {Promise<{ success: boolean }>}
 */
export async function markAllNotificationsAsRead() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para realizar esta acción.', { status: 401 });
  }

  if (USE_MOCK) {
    await waitForMock();
    for (const notification of store.notifications) {
      if (notification.userId === user.id) {
        notification.read = true;
      }
    }
    return { success: true };
  }

  const response = await http.put('/api/notifications/read-all');
  return response.data;
}
