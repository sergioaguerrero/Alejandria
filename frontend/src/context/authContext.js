/**
 * @file authContext.js
 * @description Contexto de sesión y hook de acceso (FE-03).
 *
 * El provider vive en AuthProvider.jsx. Este archivo solo expone el
 * contexto y el hook para que los componentes no importen el provider.
 *
 * Se mantiene separado por la regla de Fast Refresh: un archivo que
 * exporta componentes no debería exportar también valores sueltos.
 */

import { createContext, useContext } from 'react';

/**
 * @typedef {object} ValorAuth
 * @property {object|null} usuario            Usuario de la sesión.
 * @property {string|null} token              Token JWT.
 * @property {boolean} estaAutenticado
 * @property {boolean} esAdmin
 * @property {(credenciales: { correo: string, password: string }) => Promise<object>} login
 * @property {(datos: object) => Promise<object>} registro
 * @property {() => void} logout
 */

/** @type {import('react').Context<ValorAuth|null>} */
export const AuthContext = createContext(null);

/**
 * Acceso al contexto de sesión.
 * @returns {ValorAuth}
 * @throws {Error} Si se usa fuera de <AuthProvider>.
 */
export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }

  return contexto;
}
