/**
 * @file App.jsx
 * @description Main router of Alejandría UPC.
 *
 * Structure:
 *   - Private routes: go through <ProtectedRoute /> and then <AppLayout />.
 *   - Public routes: go through <AuthLayout /> (login, register, recovery).
 *   - Any other route falls into view 26 (404).
 *
 * Admin routes will be protected with roles={['admin']} when
 * the Sprint 3 views exist.
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import AuthProvider from './context/AuthProvider.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ErrorPage from './pages/error/ErrorPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ─────────────────────────────────────────── */}
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ── Private routes ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
            </Route>
          </Route>

          {/* ── Errors ────────────────────────────────────────────────── */}
          <Route path="/403" element={<ErrorPage code={403} />} />
          <Route path="*" element={<ErrorPage code={404} />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
