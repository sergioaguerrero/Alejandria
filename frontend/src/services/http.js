/**
 * @file http.js
 * @description Instancia única de Axios para toda la aplicación.
 *
 * - Agrega el token JWT de la sesión a cada petición.
 * - Convierte cualquier error en un ErrorApi con mensaje en español.
 *
 * Ninguna pantalla debe importar Axios directamente: siempre pasa por
 * los servicios (authService, repoService, documentoService, ...).
 */

import axios from 'axios';

import { API_URL, TOKEN_KEY } from './config.js';
import { normalizarError } from './errores.js';

const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

// ── Petición: adjunta el token de la sesión ────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Respuesta: normaliza los errores ───────────────────────────────────────
http.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => Promise.reject(normalizarError(error)),
);

export default http;
