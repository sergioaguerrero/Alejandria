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
  changePassword as changePasswordService,
  logout as logoutService,
  login as loginService,
  getCurrentSession,
  register as registerService,
  resendVerificationCode as resendVerificationCodeService,
  updateProfile as updateProfileService,
  verifyEmail as verifyEmailService,
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
    const result = await registerService(data);
    if (result?.token && !result?.requiresVerification) {
      setSession({ token: result.token, user: result.user });
    }
    return result;
  }, []);

  const verifyEmail = useCallback(async (data) => {
    const newSession = await verifyEmailService(data);
    if (newSession?.token && newSession?.user) {
      setSession({ token: newSession.token, user: newSession.user });
    }
    return newSession;
  }, []);

  const resendVerificationCode = useCallback(
    (email) => resendVerificationCodeService(email),
    [],
  );

  const logout = useCallback(() => {
    logoutService();
    setSession(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updatedUser = await updateProfileService(data);
    setSession((current) => (current ? { ...current, user: updatedUser } : current));
    return updatedUser;
  }, []);

  const changePassword = useCallback((data) => changePasswordService(data), []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.user),
      isAdmin: session?.user?.role === 'admin',
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      logout,
      updateProfile,
      changePassword,
    }),
    [
      session,
      login,
      register,
      verifyEmail,
      resendVerificationCode,
      logout,
      updateProfile,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
