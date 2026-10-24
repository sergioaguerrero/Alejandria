/**
 * @file validations.js
 * @description Validation rules shared by the forms.
 *
 * They are used in the registration (view 2), in the profile (view 14)
 * and in the document upload (view 9), to avoid repeating the same logic.
 */

/** Allowed institutional domain. */
export const INSTITUTIONAL_DOMAIN = '@unicesar.edu.co';

/** Maximum accepted file size: 25 MB. */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed extensions for the documents. */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
];

/** Allowed MIME types for the documents. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_USERNAME = /^[a-zA-Z0-9._]{3,20}$/;

/**
 * Indicates if the email has a valid format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email ?? '').trim());
}

/**
 * Indicates if the email belongs to the institutional domain.
 * @param {string} email
 * @returns {boolean}
 */
export function isInstitutionalEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
    .endsWith(INSTITUTIONAL_DOMAIN);
}

/**
 * Indicates if the username fulfills the format (3 to 20 characters,
 * letters, numbers, period and underscore).
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
  return REGEX_USERNAME.test(String(username ?? '').trim());
}

/**
 * Lists the password rules that the value does not fulfill yet.
 * @param {string} password
 * @returns {string[]} Messages of the pending rules (empty if it fulfills all of them).
 */
export function passwordErrors(password) {
  const value = String(password ?? '');
  const errors = [];

  if (value.length < 8) errors.push('Debe tener al menos 8 caracteres.');
  if (!/[A-Z]/.test(value)) errors.push('Debe incluir una letra mayúscula.');
  if (!/[a-z]/.test(value)) errors.push('Debe incluir una letra minúscula.');
  if (!/\d/.test(value)) errors.push('Debe incluir un número.');

  return errors;
}

/**
 * Indicates if the password fulfills all the rules.
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return passwordErrors(password).length === 0;
}

/**
 * Gets the extension of a file in lowercase.
 * @param {{ name?: string }} file
 * @returns {string}
 */
export function getExtension(file) {
  const name = file?.name ?? '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.at(-1).toLowerCase() : '';
}

/**
 * Validates a file before uploading it.
 * @param {File|{ name?: string, size?: number, type?: string }|null} file
 * @returns {string|null} Error message, or null if the file is valid.
 */
export function validateFile(file) {
  if (!file) {
    return 'Selecciona un archivo.';
  }

  const extension = getExtension(file);

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return `Formato no permitido. Acepta: ${ALLOWED_EXTENSIONS.join(', ')}.`;
  }

  const size = file.size ?? 0;
  if (size > MAX_FILE_SIZE_BYTES) {
    return `El archivo supera el límite de ${formatSize(MAX_FILE_SIZE_BYTES)}.`;
  }

  return null;
}

/**
 * Converts bytes to a readable text.
 * @param {number} bytes
 * @returns {string}
 */
export function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
