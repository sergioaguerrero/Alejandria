/**
 * @file ProtectedRoute.jsx
 * @description Guarda de rutas privadas (FE-03).
 *
 * - Sin sesión → redirige al login guardando la ruta de origen.
 * - Con sesión pero rol incorrecto → vista 26 (403).
 * - Con sesión y rol correcto → renderiza la ruta hija.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/authContext.js';

/**
 * @param {object} props
 * @param {string[]|null} [props.roles]  Roles permitidos. Si se omite, basta con tener sesión.
 */
export default function ProtectedRoute({ roles = null }) {
  const { estaAutenticado, usuario } = useAuth();
  const ubicacion = useLocation();

  if (!estaAutenticado) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    );
  }

  if (roles && !roles.includes(usuario?.rol)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
