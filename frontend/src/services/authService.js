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
 * Logs in with an email and a password.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<Session>}
 * @throws {ApiError} 401 if the credentials do not match, 403 if the account is suspended.
 */
export async function login({ email, password }) {
  const cleanEmail = String(email ?? '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new ApiError('Escribe tu correo y tu contraseña.', { status: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post('/auth/login', { email: cleanEmail, password });
    saveSession(data);
    return data;
  }

  await waitForMock(700);

  const user = store.users.find(
    (candidate) => candidate.email.toLowerCase() === cleanEmail,
  );

  if (!user || user.password !== password) {
    throw new ApiError('Credenciales incorrectas. Revisa tu correo y contraseña.', {
      status: 401,
    });
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
 * @property {string} name
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
  const name = String(data.name ?? '').trim();
  const username = String(data.username ?? '').trim().toLowerCase();
  const email = String(data.email ?? '').trim().toLowerCase();
  const { password } = data;
  const semester = data.semester ?? null;

  if (!USE_MOCK) {
    const { data: response } = await http.post('/auth/register', {
      name,
      username,
      email,
      password,
      semester,
    });
    saveSession(response);
    return response;
  }

  await waitForMock(700);

  /** @type {Record<string, string>} */
  const fields = {};

  if (name.length < 3) fields.name = 'Escribe tu nombre completo.';

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
    name,
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
