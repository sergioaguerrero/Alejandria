/**
 * @file validaciones.js
 * @description Reglas de validación compartidas por los formularios.
 *
 * Se usan en el registro (vista 2), en el perfil (vista 14) y en la
 * subida de documentos (vista 9), para no repetir la misma lógica.
 */

/** Dominio institucional permitido. */
export const DOMINIO_INSTITUCIONAL = '@unicesar.edu.co';

/** Tamaño máximo de archivo aceptado: 25 MB. */
export const TAMANO_MAXIMO_BYTES = 25 * 1024 * 1024;

/** Extensiones permitidas para los documentos. */
export const EXTENSIONES_PERMITIDAS = [
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

/** Tipos MIME permitidos para los documentos. */
export const MIMES_PERMITIDOS = [
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

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_USERNAME = /^[a-zA-Z0-9._]{3,20}$/;

/**
 * Indica si el correo tiene un formato válido.
 * @param {string} correo
 * @returns {boolean}
 */
export function esCorreoValido(correo) {
  return REGEX_CORREO.test(String(correo ?? '').trim());
}

/**
 * Indica si el correo pertenece al dominio institucional.
 * @param {string} correo
 * @returns {boolean}
 */
export function esCorreoInstitucional(correo) {
  return String(correo ?? '')
    .trim()
    .toLowerCase()
    .endsWith(DOMINIO_INSTITUCIONAL);
}

/**
 * Indica si el nombre de usuario cumple el formato (3 a 20 caracteres,
 * letras, números, punto y guion bajo).
 * @param {string} username
 * @returns {boolean}
 */
export function esUsernameValido(username) {
  return REGEX_USERNAME.test(String(username ?? '').trim());
}

/**
 * Lista las reglas de contraseña que todavía no cumple el valor.
 * @param {string} password
 * @returns {string[]} Mensajes de las reglas pendientes (vacío si cumple todas).
 */
export function erroresDePassword(password) {
  const valor = String(password ?? '');
  const errores = [];

  if (valor.length < 8) errores.push('Debe tener al menos 8 caracteres.');
  if (!/[A-Z]/.test(valor)) errores.push('Debe incluir una letra mayúscula.');
  if (!/[a-z]/.test(valor)) errores.push('Debe incluir una letra minúscula.');
  if (!/\d/.test(valor)) errores.push('Debe incluir un número.');

  return errores;
}

/**
 * Indica si la contraseña cumple todas las reglas.
 * @param {string} password
 * @returns {boolean}
 */
export function esPasswordValida(password) {
  return erroresDePassword(password).length === 0;
}

/**
 * Obtiene la extensión de un archivo en minúsculas.
 * @param {{ name?: string, nombre?: string }} archivo
 * @returns {string}
 */
export function obtenerExtension(archivo) {
  const nombre = archivo?.name ?? archivo?.nombre ?? '';
  const partes = nombre.split('.');
  return partes.length > 1 ? partes.at(-1).toLowerCase() : '';
}

/**
 * Valida un archivo antes de subirlo.
 * @param {File|{ name?: string, size?: number, type?: string }|null} archivo
 * @returns {string|null} Mensaje de error, o null si el archivo es válido.
 */
export function validarArchivo(archivo) {
  if (!archivo) {
    return 'Selecciona un archivo.';
  }

  const extension = obtenerExtension(archivo);

  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    return `Formato no permitido. Acepta: ${EXTENSIONES_PERMITIDAS.join(', ')}.`;
  }

  const tamano = archivo.size ?? 0;
  if (tamano > TAMANO_MAXIMO_BYTES) {
    return `El archivo supera el límite de ${formatearTamano(TAMANO_MAXIMO_BYTES)}.`;
  }

  return null;
}

/**
 * Convierte bytes a un texto legible.
 * @param {number} bytes
 * @returns {string}
 */
export function formatearTamano(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';

  const unidades = ['B', 'KB', 'MB', 'GB'];
  const indice = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  const valor = bytes / 1024 ** indice;

  return `${valor.toFixed(indice === 0 ? 0 : 1)} ${unidades[indice]}`;
}
