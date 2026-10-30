/**
 * @file authService.js
 * @description Registration, login and logout (FE-04 and FE-05).
 *
 * In mock mode it validates the credentials against src/mocks/users.js.
 * In real mode it calls the BE-05 (registration) and BE-06 (login) endpoints.
 *
 * Screens only call these functions; never Axios or the mocks.
 */

import {
  TOKEN_KEY,
  USER_KEY,
  USE_MOCK,
  waitForMock,
} from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { nextId, store } from '../mocks/store.js';
import { withoutPassword } from '../utils/users.js';
import {
  isInstitutionalEmail,
  isValidEmail,
  passwordErrors,
  isValidUsername,
} from '../utils/validations.js';

/**
 * @typedef {object} Session
 * @property {object} user
 * @property {string} token
 */

// ── Session ────────────────────────────────────────────────────────────────

/**
 * Saves the user and the token in localStorage.
 * @param {Session} session
 */
export function saveSession({ user, token }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Reads the saved session.
 * @returns {Session|null}
 */
export function getCurrentSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (!token || !savedUser) return null;

  try {
    return { token, user: JSON.parse(savedUser) };
  } catch {
    return null;
  }
}

/**
 * Returns the user of the current session, or null.
 * @returns {object|null}
 */
export function currentUser() {
  return getCurrentSession()?.user ?? null;
}

/** Deletes the saved session. */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Login (FE-05) ──────────────────────────────────────────────────────────

/**
 * Logs in with the username or the email, plus the password.
 * @param {{ identifier: string, password: string }} credentials  Identifier: a username or an email.
 * @returns {Promise<Session>}
 * @throws {ApiError} 401 if the credentials do not match, 403 if the account is suspended.
 */
export async function login({ identifier, password }) {
  const cleanIdentifier = String(identifier ?? '').trim().toLowerCase();

  if (!cleanIdentifier || !password) {
    throw new ApiError('Escribe tu usuario o tu correo y tu contraseña.', { status: 400 });
  }

  const isEmail = cleanIdentifier.includes('@');

  if (!USE_MOCK) {
    // TODO(BE-41): confirm the login body against Swagger (BE-06).
    const { data } = await http.post('/auth/login', {
      identifier: cleanIdentifier,
      password,
    });
    saveSession(data);
    return data;
  }

  await waitForMock(700);

  const user = store.users.find((candidate) =>
    isEmail
      ? candidate.email.toLowerCase() === cleanIdentifier
      : candidate.username.toLowerCase() === cleanIdentifier,
  );

  if (!user || user.password !== password) {
    throw new ApiError(
      'Credenciales incorrectas. Revisa tu usuario o correo y tu contraseña.',
      { status: 401 },
    );
  }

  if (user.suspended) {
    throw new ApiError(
      'Tu cuenta está suspendida. Escribe a coordinación académica para más información.',
      { status: 403 },
    );
  }

  const session = {
    user: /** @type {any} */ (withoutPassword(user)),
    token: `mock.${user.id}.${Date.now()}`,
  };

  saveSession(session);
  return session;
}

// ── Registration (FE-04) ───────────────────────────────────────────────────

/**
 * @typedef {object} RegistrationData
 * @property {string} first_name
 * @property {string} [second_name]
 * @property {string} first_lastname
 * @property {string} second_lastname
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {number|null} [semester]
 */

/**
 * Registers a new student and leaves the session started.
 * @param {RegistrationData} data
 * @returns {Promise<Session>}
 * @throws {ApiError} 400 with `fields` if there is invalid data, 409 if the email or the user already exist.
 */
export async function register(data) {
  const first_name = String(data.first_name ?? '').trim();
  const second_name = String(data.second_name ?? '').trim();
  const first_lastname = String(data.first_lastname ?? '').trim();
  const second_lastname = String(data.second_lastname ?? '').trim();
  const username = String(data.username ?? '').trim().toLowerCase();
  const email = String(data.email ?? '').trim().toLowerCase();
  const { password } = data;
  const semester = data.semester ?? null;

  const fullName = [first_name, second_name, first_lastname, second_lastname]
    .filter(Boolean)
    .join(' ');

  if (!USE_MOCK) {
    const { data: response } = await http.post('/auth/register', {
      first_name,
      second_name,
      first_lastname,
      second_lastname,
      username,
      institutionalEmail: email,
      email,
      passwordHash: password,
      password,
      semester,
    });
    saveSession(response);
    return response;
  }

  await waitForMock(700);

  /** @type {Record<string, string>} */
  const fields = {};

  if (!isValidUsername(username)) {
    fields.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.';
  } else if (store.users.some((user) => user.username === username)) {
    fields.username = 'Ese nombre de usuario ya está en uso.';
  }

  if (!isValidEmail(email)) {
    fields.email = 'Escribe un correo válido.';
  } else if (!isInstitutionalEmail(email)) {
    fields.email = 'Debes usar tu correo institucional @unicesar.edu.co.';
  } else if (store.users.some((user) => user.email.toLowerCase() === email)) {
    fields.email = 'Ya existe una cuenta con ese correo.';
  }

  const passwordErrorList = passwordErrors(password);
  if (passwordErrorList.length > 0) {
    fields.password = passwordErrorList.join(' ');
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del formulario.', { status: 400, fields });
  }

  const newUser = {
    id: nextId('user'),
    name: fullName || username,
    first_name,
    second_name,
    first_lastname,
    second_lastname,
    username,
    email,
    semester: semester ? Number(semester) : null,
    role: 'estudiante',
    password,
    suspended: false,
  };

  store.users.push(newUser);

  const session = {
    user: /** @type {any} */ (withoutPassword(newUser)),
    token: `mock.${newUser.id}.${Date.now()}`,
  };

  saveSession(session);
  return session;
}

// ── Profile (FE-07, BE-08) ─────────────────────────────────────────────────

/**
 * @typedef {object} ProfileData
 * @property {string} name
 * @property {string} username
 * @property {number|null} semester
 */

/**
 * Updates the editable data of the current user (name, username and semester).
 * The email cannot be changed.
 * @param {ProfileData} data
 * @returns {Promise<object>} The updated user.
 * @throws {ApiError} 400 with `fields` if there is invalid data, 401 without
 *   session, 409 if another account already uses the username.
 */
export async function updateProfile(data) {
  const name = String(data.name ?? '').trim();
  const username = String(data.username ?? '').trim().toLowerCase();
  const semester =
    data.semester === null || data.semester === undefined || data.semester === ''
      ? null
      : Number(data.semester);

  if (!USE_MOCK) {
    const { data: updatedUser } = await http.put('/users/me', {
      name,
      username,
      semester,
    });
    const session = getCurrentSession();
    if (session) saveSession({ ...session, user: updatedUser });
    return updatedUser;
  }

  await waitForMock();

  const session = getCurrentSession();
  if (!session) {
    throw new ApiError('Debes iniciar sesión para editar tu perfil.', { status: 401 });
  }

  const storedUser = store.users.find((user) => user.id === session.user.id);
  if (!storedUser) {
    throw new ApiError('No se encontró tu cuenta.', { status: 404 });
  }

  /** @type {Record<string, string>} */
  const fields = {};

  if (name.length < 3 || name.length > 80) {
    fields.name = 'Escribe tu nombre completo (entre 3 y 80 caracteres).';
  }

  if (!isValidUsername(username)) {
    fields.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.';
  } else if (
    store.users.some((user) => user.id !== storedUser.id && user.username === username)
  ) {
    fields.username = 'Ese nombre de usuario ya está en uso.';
  }

  if (storedUser.role !== 'admin') {
    if (semester === null) {
      fields.semester = 'Selecciona tu semestre.';
    } else if (!Number.isInteger(semester) || semester < 1 || semester > 9) {
      fields.semester = 'Selecciona un semestre entre 1 y 9.';
    }
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del formulario.', { status: 400, fields });
  }

  const previousUsername = storedUser.username;

  storedUser.name = name;
  storedUser.username = username;
  if (storedUser.role !== 'admin') storedUser.semester = semester;

  // The example data references the user by username, so a change is mirrored
  // everywhere to keep the ownership of the content and the inbox consistent.
  if (previousUsername !== username) {
    for (const repository of store.repositories) {
      if (repository.authorUsername === previousUsername) repository.authorUsername = username;
    }

    for (const document of store.documents) {
      if (document.authorUsername === previousUsername) document.authorUsername = username;
    }

    for (const report of store.reports) {
      if (report.reporterUsername === previousUsername) report.reporterUsername = username;
      if (report.targetType === 'profile' && report.targetId === previousUsername) {
        report.targetId = username;
      }
    }
  }

  const updatedUser = /** @type {any} */ (withoutPassword(storedUser));
  saveSession({ ...session, user: updatedUser });
  return updatedUser;
}

/**
 * Changes the password of the current user after checking the current one.
 * @param {{ currentPassword: string, newPassword: string }} data
 * @returns {Promise<void>}
 * @throws {ApiError} 400 with `fields` if there is invalid data, 401 without session.
 */
export async function changePassword({ currentPassword, newPassword }) {
  if (!USE_MOCK) {
    await http.put('/users/me/password', { currentPassword, newPassword });
    return;
  }

  await waitForMock();

  const session = getCurrentSession();
  if (!session) {
    throw new ApiError('Debes iniciar sesión para cambiar tu contraseña.', { status: 401 });
  }

  const storedUser = store.users.find((user) => user.id === session.user.id);
  if (!storedUser) {
    throw new ApiError('No se encontró tu cuenta.', { status: 404 });
  }

  /** @type {Record<string, string>} */
  const fields = {};

  if (!currentPassword) {
    fields.currentPassword = 'Escribe tu contraseña actual.';
  } else if (storedUser.password !== currentPassword) {
    fields.currentPassword = 'La contraseña actual no es correcta.';
  }

  const pendingRules = passwordErrors(newPassword);
  if (pendingRules.length > 0) {
    fields.newPassword = pendingRules.join(' ');
  } else if (newPassword === currentPassword) {
    fields.newPassword = 'La nueva contraseña debe ser diferente a la actual.';
  }

  if (Object.keys(fields).length > 0) {
    throw new ApiError('Revisa los datos del formulario.', { status: 400, fields });
  }

  storedUser.password = newPassword;
}

/**
 * Requests a password reset link by email (FE-08, BE-10).
 * Returns a neutral success message regardless of whether the email exists.
 * @param {string} email
 * @returns {Promise<{ success: boolean, message: string, testToken?: string }>}
 */
export async function requestPasswordReset(email) {
  const cleanEmail = String(email ?? '').trim().toLowerCase();

  if (!cleanEmail) {
    throw new ApiError('Escribe tu correo institucional.', {
      status: 400,
      fields: { email: 'Escribe tu correo institucional.' },
    });
  }

  if (!isValidEmail(cleanEmail) || !isInstitutionalEmail(cleanEmail)) {
    throw new ApiError('Debes ingresar un correo institucional válido (@unicesar.edu.co).', {
      status: 400,
      fields: { email: 'Debes ingresar un correo institucional válido (@unicesar.edu.co).' },
    });
  }

  if (!USE_MOCK) {
    const { data } = await http.post('/api/auth/recover', { email: cleanEmail });
    return data;
  }

  await waitForMock(300);

  const foundUser = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
  let testToken = null;

  if (foundUser) {
    testToken = `token-${Math.random().toString(36).substring(2, 10)}`;
    store.resetTokens.set(testToken, {
      userId: foundUser.id,
      email: foundUser.email,
      expiresAt: Date.now() + 1000 * 60 * 60, // 1 hour
    });
  }

  return {
    success: true,
    message: 'Si el correo institucional existe en nuestro sistema, te enviamos un enlace de recuperación.',
    testToken,
  };
}

/**
 * Resets the password using a recovery token (FE-08, BE-10).
 * @param {{ token: string, newPassword: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function resetPassword({ token, newPassword }) {
  const cleanToken = String(token ?? '').trim();
  const cleanPassword = String(newPassword ?? '');

  if (!cleanToken) {
    throw new ApiError('El token de restablecimiento es inválido o expiró.', {
      status: 400,
      code: 'TOKEN_EXPIRED',
    });
  }

  const rules = passwordErrors(cleanPassword);
  if (rules.length > 0) {
    throw new ApiError('La contraseña no cumple con los requisitos de seguridad.', {
      status: 400,
      fields: { newPassword: rules.join(' ') },
    });
  }

  if (!USE_MOCK) {
    const { data } = await http.post('/api/auth/reset', {
      token: cleanToken,
      newPassword: cleanPassword,
    });
    return data;
  }

  await waitForMock(300);

  if (cleanToken === 'expired') {
    throw new ApiError('El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.', {
      status: 400,
      code: 'TOKEN_EXPIRED',
    });
  }

  const tokenRecord = store.resetTokens.get(cleanToken);
  if (!tokenRecord || Date.now() > tokenRecord.expiresAt) {
    throw new ApiError('El enlace ha expirado o ya fue utilizado. Solicita uno nuevo.', {
      status: 400,
      code: 'TOKEN_EXPIRED',
    });
  }

  const user = store.users.find((u) => u.id === tokenRecord.userId);
  if (!user) {
    throw new ApiError('Usuario no encontrado.', { status: 404 });
  }

  user.password = cleanPassword;
  store.resetTokens.delete(cleanToken);

  return {
    success: true,
    message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
  };
}
