/**
 * @file ProtectedRoute.jsx
 * @description Private route guard (FE-03).
 *
 * - No session → redirects to login saving the origin route.
 * - With session but wrong role → view 26 (403).
 * - With session and correct role → renders the child route.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/authContext.js';

/**
 * @param {object} props
 * @param {string[]|null} [props.roles]  Allowed roles. If omitted, having a session is enough.
 */
export default function ProtectedRoute({ roles = null }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
