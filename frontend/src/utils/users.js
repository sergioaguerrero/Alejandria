/**
 * @file users.js
 * @description Utilities to work with the user object.
 */

/**
 * Returns a copy of the user without the password field.
 * @template {object} T
 * @param {T|null|undefined} user
 * @returns {Omit<T, 'password'>|null}
 */
export function withoutPassword(user) {
  if (!user) return null;

  const copy = { ...user };
  delete copy.password;
  return copy;
}

/**
 * Short name to show in the interface: @username.
 * @param {{ username?: string }|null|undefined} user
 * @returns {string}
 */
export function usernameLabel(user) {
  return user?.username ? `@${user.username}` : '';
}

/**
 * Initials of the username, for the avatars.
 * @param {{ username?: string }|null|undefined} user
 * @returns {string}
 */
export function initials(user) {
  const parts = String(user?.username ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
}
