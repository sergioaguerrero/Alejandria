/**
 * @file config.js
 * @description Configuración central de la capa de servicios.
 *
 * La variable VITE_USE_MOCK decide de dónde salen los datos:
 *   - true  (por defecto) → src/mocks, permite avanzar sin backend (FE-02)
 *   - false               → API real mediante Axios
 *
 * Cuando el backend esté listo, basta con poner VITE_USE_MOCK=false
 * y las pantallas siguen funcionando igual.
 */

const valorMock = import.meta.env.VITE_USE_MOCK;

/**
 * true si la aplicación debe usar los datos de ejemplo.
 * Si la variable no está definida se asume true, para que el proyecto
 * funcione recién clonado sin crear archivos .env.
 * @type {boolean}
 */
export const USE_MOCK =
  valorMock === undefined ? true : String(valorMock).toLowerCase() !== 'false';

/** URL base del backend. @type {string} */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

/** Retardo simulado de las respuestas mock, en milisegundos. @type {number} */
export const LATENCIA_MOCK_MS = Number(import.meta.env.VITE_MOCK_DELAY ?? 400);

/** Clave de localStorage donde se guarda el token JWT. @type {string} */
export const TOKEN_KEY = 'alejandria_token';

/** Clave de localStorage donde se guarda el usuario de la sesión. @type {string} */
export const USUARIO_KEY = 'alejandria_usuario';

/**
 * Espera el tiempo indicado. Se usa en los mocks para simular la red
 * y que se alcancen a ver los estados de carga.
 * @param {number} [ms=LATENCIA_MOCK_MS]
 * @returns {Promise<void>}
 */
export function esperarMock(ms = LATENCIA_MOCK_MS) {
  return new Promise((resolver) => {
    setTimeout(resolver, ms);
  });
}
