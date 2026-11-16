/**
 * @file notificationMeta.js
 * @description Shared metadata labels for notification types (FE-18, FE-19, FE-32).
 */

const NOTIFICATION_LABELS = {
  new_content: 'Novedad',
  warning: 'Advertencia',
  content_hidden: 'Contenido ocultado',
  content_deleted: 'Contenido eliminado',
  sanction: 'Sanción',
  like: 'Interacción',
  report_pending: 'Moderación',
  new_follower: 'Seguidor',
  friend_match: 'Amigo',
  ai_shared: 'IA compartida',
  collab_invite: 'Colaboración',
};

/**
 * Returns a human-readable label for a notification type.
 * @param {string} type
 * @returns {string}
 */
export function notificationTypeLabel(type) {
  return NOTIFICATION_LABELS[type] ?? 'Aviso';
}
