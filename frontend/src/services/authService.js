/**
 * @file authService.js
 * @description Registro, inicio y cierre de sesión (FE-04 y FE-05).
 *
 * En modo mock valida las credenciales contra src/mocks/usuarios.js.
 * En modo real llama a los endpoints de BE-05 (registro) y BE-06 (login).
 *
 * Las pantallas solo llaman a estas funciones; nunca a Axios ni a los mocks.
 */

import {
  TOKEN_KEY,
  USUARIO_KEY,
  USE_MOCK,
  esperarMock,
} from './config.js';
import { ErrorApi } from './errores.js';
import http from './http.js';
import { siguienteId, store } from '../mocks/store.js';
import { sinPassword } from '../utils/usuarios.js';
import {
  esCorreoInstitucional,
  esCorreoValido,
  erroresDePassword,
  esUsernameValido,
} from '../utils/validaciones.js';

/**
 * @typedef {object} Sesion
 * @property {object} usuario
 * @property {string} token
 */

// ── Sesión ─────────────────────────────────────────────────────────────────

/**
 * Guarda el usuario y el token en localStorage.
 * @param {Sesion} sesion
 */
export function guardarSesion({ usuario, token }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

/**
 * Lee la sesión guardada.
 * @returns {Sesion|null}
 */
export function obtenerSesionActual() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuarioGuardado = localStorage.getItem(USUARIO_KEY);

  if (!token || !usuarioGuardado) return null;

  try {
    return { token, usuario: JSON.parse(usuarioGuardado) };
  } catch {
    return null;
  }
}

/**
 * Devuelve el usuario de la sesión actual, o null.
 * @returns {object|null}
 */
export function usuarioActual() {
  return obtenerSesionActual()?.usuario ?? null;
}

/** Borra la sesión guardada. */
export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

// ── Login (FE-05) ──────────────────────────────────────────────────────────

/**
 * Inicia sesión con correo y contraseña.
 * @param {{ correo: string, password: string }} credenciales
 * @returns {Promise<Sesion>}
 * @throws {ErrorApi} 401 si las credenciales no coinciden, 403 si la cuenta está suspendida.
 */
export async function login({ correo, password }) {
  const correoLimpio = String(correo ?? '').trim().toLowerCase();

  if (!correoLimpio || !password) {
    throw new ErrorApi('Escribe tu correo y tu contraseña.', { estado: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post('/auth/login', { correo: correoLimpio, password });
    guardarSesion(data);
    return data;
  }

  await esperarMock(700);

  const usuario = store.usuarios.find(
    (candidato) => candidato.correo.toLowerCase() === correoLimpio,
  );

  if (!usuario || usuario.password !== password) {
    throw new ErrorApi('Credenciales incorrectas. Revisa tu correo y contraseña.', {
      estado: 401,
    });
  }

  if (usuario.suspendido) {
    throw new ErrorApi(
      'Tu cuenta está suspendida. Escribe a coordinación académica para más información.',
      { estado: 403 },
    );
  }

  const sesion = {
    usuario: /** @type {any} */ (sinPassword(usuario)),
    token: `mock.${usuario.id}.${Date.now()}`,
  };

  guardarSesion(sesion);
  return sesion;
}

// ── Registro (FE-04) ───────────────────────────────────────────────────────

/**
 * @typedef {object} DatosRegistro
 * @property {string} nombre
 * @property {string} username
 * @property {string} correo
 * @property {string} password
 * @property {number|null} [semestre]
 */

/**
 * Registra un estudiante nuevo y deja la sesión iniciada.
 * @param {DatosRegistro} datos
 * @returns {Promise<Sesion>}
 * @throws {ErrorApi} 400 con `campos` si hay datos inválidos, 409 si el correo o el usuario ya existen.
 */
export async function registro(datos) {
  const nombre = String(datos.nombre ?? '').trim();
  const username = String(datos.username ?? '').trim().toLowerCase();
  const correo = String(datos.correo ?? '').trim().toLowerCase();
  const { password } = datos;
  const semestre = datos.semestre ?? null;

  if (!USE_MOCK) {
    const { data } = await http.post('/auth/registro', {
      nombre,
      username,
      correo,
      password,
      semestre,
    });
    guardarSesion(data);
    return data;
  }

  await esperarMock(700);

  /** @type {Record<string, string>} */
  const campos = {};

  if (nombre.length < 3) campos.nombre = 'Escribe tu nombre completo.';

  if (!esUsernameValido(username)) {
    campos.username = 'Entre 3 y 20 caracteres: letras, números, punto o guion bajo.';
  } else if (store.usuarios.some((usuario) => usuario.username === username)) {
    campos.username = 'Ese nombre de usuario ya está en uso.';
  }

  if (!esCorreoValido(correo)) {
    campos.correo = 'Escribe un correo válido.';
  } else if (!esCorreoInstitucional(correo)) {
    campos.correo = 'Debes usar tu correo institucional @unicesar.edu.co.';
  } else if (store.usuarios.some((usuario) => usuario.correo.toLowerCase() === correo)) {
    campos.correo = 'Ya existe una cuenta con ese correo.';
  }

  const erroresPassword = erroresDePassword(password);
  if (erroresPassword.length > 0) {
    campos.password = erroresPassword.join(' ');
  }

  if (Object.keys(campos).length > 0) {
    throw new ErrorApi('Revisa los datos del formulario.', { estado: 400, campos });
  }

  const nuevoUsuario = {
    id: siguienteId('usuario'),
    nombre,
    username,
    correo,
    semestre: semestre ? Number(semestre) : null,
    rol: 'estudiante',
    password,
    suspendido: false,
  };

  store.usuarios.push(nuevoUsuario);

  const sesion = {
    usuario: /** @type {any} */ (sinPassword(nuevoUsuario)),
    token: `mock.${nuevoUsuario.id}.${Date.now()}`,
  };

  guardarSesion(sesion);
  return sesion;
}
