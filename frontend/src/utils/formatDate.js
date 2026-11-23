/**
 * @file formatDate.js
 * @description Helper to format ISO dates in Spanish relative or absolute terms.
 */

/**
 * Formats an ISO date string into human-readable Spanish relative or short date.
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatRelativeDate(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) {
    return 'Hace un momento';
  }
  if (diffMin < 60) {
    return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  }
  if (diffDays === 1) {
    return 'Ayer';
  }
  if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  }

  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Formats an ISO date string into a short Spanish calendar date (e.g. "22 nov 2026").
 * @param {string|Date|undefined|null} dateInput
 * @returns {string}
 */
export function formatShortDate(dateInput) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
