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

/**
 * Returns the MUI palette key matching a notification type.
 * @param {string} type
 * @returns {'primary'|'info'|'success'|'warning'|'error'}
 */
export function getNotificationAccent(type) {
  switch (type) {
    case 'warning':
    case 'content_hidden':
      return 'warning';
    case 'sanction':
    case 'content_deleted':
    case 'report_pending':
      return 'error';
    case 'friend_match':
      return 'success';
    case 'collab_invite':
      return 'info';
    default:
      return 'primary';
  }
}

/**
 * Splits a notification message into plain and @mention segments.
 * @param {string} message
 * @returns {Array<{ text: string, isMention: boolean }>}
 */
export function splitMentionSegments(message) {
  if (!message) return [];
  return message
    .split(/(@[a-zA-Z0-9._-]+)/g)
    .filter(Boolean)
    .map((part) => ({
      text: part,
      isMention: part.startsWith('@') && part.length > 1,
    }));
}
