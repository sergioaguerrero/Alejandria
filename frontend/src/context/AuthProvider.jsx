/**
 * @file AuthProvider.jsx
 * @description Provider de la sesión (FE-03).
 *
 * Envuelve a authService y guarda en el estado de React la sesión que
 * ya está persistida en localStorage, para que un F5 no cierre la sesión.
 */

import { useCallback, useMemo, useState } from 'react';

import { AuthContext } from './authContext.js';
import {
  cerrarSesion as cerrarSesionServicio,
  login as loginServicio,
  obtenerSesionActual,
  registro as registroServicio,
} from '../services/authService.js';

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export default function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => obtenerSesionActual());

  const login = useCallback(async (credenciales) => {
    const nuevaSesion = await loginServicio(credenciales);
    setSesion(nuevaSesion);
    return nuevaSesion;
  }, []);

  const registro = useCallback(async (datos) => {
    const nuevaSesion = await registroServicio(datos);
    setSesion(nuevaSesion);
    return nuevaSesion;
  }, []);

  const logout = useCallback(() => {
    cerrarSesionServicio();
    setSesion(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario: sesion?.usuario ?? null,
      token: sesion?.token ?? null,
      estaAutenticado: Boolean(sesion?.usuario),
      esAdmin: sesion?.usuario?.rol === 'admin',
      login,
      registro,
      logout,
    }),
    [sesion, login, registro, logout],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
