/**
 * @file AuthProvider.jsx
 * @description Session provider (FE-03).
 *
 * Wraps authService and stores in React state the session that is
 * already persisted in localStorage, so an F5 does not close the session.
 */

import { useCallback, useMemo, useState } from 'react';

import { AuthContext } from './authContext.js';
import {
  logout as logoutService,
  login as loginService,
  getCurrentSession,
  register as registerService,
} from '../services/authService.js';

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentSession());

  const login = useCallback(async (credentials) => {
    const newSession = await loginService(credentials);
    setSession(newSession);
    return newSession;
  }, []);

  const register = useCallback(async (data) => {
    const newSession = await registerService(data);
    setSession(newSession);
    return newSession;
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.user),
      isAdmin: session?.user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
