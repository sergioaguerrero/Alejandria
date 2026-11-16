/**
 * @file authContext.js
 * @description Session context and access hook (FE-03).
 *
 * The provider lives in AuthProvider.jsx. This file only exposes the
 * context and the hook so that components don't import the provider.
 *
 * It is kept separate because of the Fast Refresh rule: a file that
 * exports components should not also export loose values.
 */

import { createContext, useContext } from 'react';

/**
 * @typedef {object} AuthValue
 * @property {object|null} user            Session user.
 * @property {string|null} token           JWT token.
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 * @property {(credentials: { identifier: string, password: string }) => Promise<object>} login
 * @property {(data: object) => Promise<object>} register
 * @property {(data: { email: string, code: string }) => Promise<object>} verifyEmail
 * @property {(email: string) => Promise<object>} resendVerificationCode
 * @property {() => void} logout
 * @property {(data: { name: string, username: string, semester: number|null }) => Promise<object>} updateProfile
 * @property {(data: { currentPassword: string, newPassword: string }) => Promise<void>} changePassword
 */

/** @type {import('react').Context<AuthValue|null>} */
export const AuthContext = createContext(null);

/**
 * Access to the session context.
 * @returns {AuthValue}
 * @throws {Error} If used outside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }

  return context;
}
