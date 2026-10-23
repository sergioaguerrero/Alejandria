/**
 * @file App.jsx
 * @description Router principal de Alejandría UPC.
 *
 * Estructura:
 *   - Rutas privadas: pasan por <ProtectedRoute /> y luego por <AppLayout />.
 *   - Rutas públicas: login, registro y recuperación (se agregan en FE-04 y FE-05).
 *   - Cualquier otra ruta cae en la vista 26 (404).
 *
 * Las rutas de administrador se protegerán con roles={['admin']} cuando
 * existan las vistas del Sprint 3.
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout.jsx';
import AuthProvider from './context/AuthProvider.jsx';
import ErrorPage from './pages/error/ErrorPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Rutas privadas ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>
          </Route>

          {/* ── Errores ────────────────────────────────────────────────── */}
          <Route path="/403" element={<ErrorPage code={403} />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
