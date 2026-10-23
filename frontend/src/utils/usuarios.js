/**
 * @file usuarios.js
 * @description Utilidades para trabajar con el objeto de usuario.
 */

/**
 * Devuelve una copia del usuario sin el campo password.
 * @template {object} T
 * @param {T|null|undefined} usuario
 * @returns {Omit<T, 'password'>|null}
 */
export function sinPassword(usuario) {
  if (!usuario) return null;

  const copia = { ...usuario };
  delete copia.password;
  return copia;
}

/**
 * Nombre corto para mostrar en la interfaz: @usuario.
 * @param {{ username?: string }|null|undefined} usuario
 * @returns {string}
 */
export function nombreUsuario(usuario) {
  return usuario?.username ? `@${usuario.username}` : '';
}

/**
 * Iniciales del nombre, para los avatares.
 * @param {{ nombre?: string }|null|undefined} usuario
 * @returns {string}
 */
export function iniciales(usuario) {
  const partes = String(usuario?.nombre ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

  return `${partes[0][0]}${partes.at(-1)[0]}`.toUpperCase();
}
