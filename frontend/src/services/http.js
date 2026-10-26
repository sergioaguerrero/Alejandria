/**
 * @file http.js
 * @description Single Axios instance for the whole application.
 *
 * - Adds the session JWT token to every request.
 * - Converts any error into an ApiError with a message in Spanish.
 *
 * No screen should import Axios directly: it always goes through
 * the services (authService, repositoryService, documentService, ...).
 */

import axios from 'axios';

import { API_URL, TOKEN_KEY } from './config.js';
import { normalizeError } from './errors.js';

const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

// ── Request: attaches the session token ────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response: normalizes the errors ────────────────────────────────────────
http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error)),
);

export default http;
