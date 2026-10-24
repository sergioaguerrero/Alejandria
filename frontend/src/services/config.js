/**
 * @file config.js
 * @description Central configuration of the services layer.
 *
 * The VITE_USE_MOCK variable decides where the data comes from:
 *   - true  (by default) → src/mocks, allows progress without a backend (FE-02)
 *   - false               → real API through Axios
 *
 * When the backend is ready, setting VITE_USE_MOCK=false is enough
 * and the screens keep working the same way.
 */

const mockValue = import.meta.env.VITE_USE_MOCK;

/**
 * true if the application must use the sample data.
 * If the variable is not defined it is assumed true, so the project
 * works freshly cloned without creating .env files.
 * @type {boolean}
 */
export const USE_MOCK =
  mockValue === undefined ? true : String(mockValue).toLowerCase() !== 'false';

/** Base URL of the backend. @type {string} */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

/** Simulated delay of the mock responses, in milliseconds. @type {number} */
export const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY ?? 400);

/** localStorage key where the JWT token is saved. @type {string} */
export const TOKEN_KEY = 'alejandria_token';

/** localStorage key where the session user is saved. @type {string} */
export const USER_KEY = 'alejandria_user';

/**
 * Waits the given time. It is used in the mocks to simulate the network
 * and to be able to see the loading states.
 * @param {number} [ms=MOCK_DELAY_MS]
 * @returns {Promise<void>}
 */
export function waitForMock(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
