/**
 * @file App.jsx
 * @description Main router of Alejandría.
 *
 * Structure:
 *   - Private routes: go through <ProtectedRoute /> and then <AppLayout />.
 *   - Public routes: go through <AuthLayout /> (login, register, verification, recovery).
 *   - Any other route falls into view 26 (404).
 *
 * Admin routes will be protected with roles={['admin']} when
 * the Sprint 3 views exist.
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import AppLayout from './components/layout/AppLayout.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import AuthProvider from './context/AuthProvider.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

// Route-level code splitting: keeps the initial bundle lean (Home + Login + Layout)
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage.jsx'));
const RecoverPasswordPage = lazy(() => import('./pages/auth/RecoverPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));
const ErrorPage = lazy(() => import('./pages/error/ErrorPage.jsx'));
const MyContentPage = lazy(() => import('./pages/content/MyContentPage.jsx'));
const MySubjectsPage = lazy(() => import('./pages/subjects/MySubjectsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage.jsx'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage.jsx'));
const PublicProfilePage = lazy(() => import('./pages/profile/PublicProfilePage.jsx'));
const FriendsPage = lazy(() => import('./pages/friends/FriendsPage.jsx'));
const RepositoryDetailPage = lazy(() => import('./pages/repositories/RepositoryDetailPage.jsx'));
const RepositoryFormPage = lazy(() => import('./pages/repositories/RepositoryFormPage.jsx'));
const RulesPage = lazy(() => import('./pages/rules/RulesPage.jsx'));
const SearchPage = lazy(() => import('./pages/search/SearchPage.jsx'));
const DocumentDetailPage = lazy(() => import('./pages/documents/DocumentDetailPage.jsx'));
const EditDocumentPage = lazy(() => import('./pages/documents/EditDocumentPage.jsx'));
const UploadDocumentPage = lazy(() => import('./pages/documents/UploadDocumentPage.jsx'));
const MyStatisticsPage = lazy(() => import('./pages/statistics/MyStatisticsPage.jsx'));
const GlobalStatisticsPage = lazy(() => import('./pages/admin/GlobalStatisticsPage.jsx'));
const ReportInboxPage = lazy(() => import('./pages/admin/ReportInboxPage.jsx'));
const ReportDetailPage = lazy(() => import('./pages/admin/ReportDetailPage.jsx'));
const AdminUserPage = lazy(() => import('./pages/admin/AdminUserPage.jsx'));
const AiStudyPage = lazy(() => import('./pages/ai/AiStudyPage.jsx'));
const AiMaterialPage = lazy(() => import('./pages/ai/AiMaterialPage.jsx'));
const QuizPage = lazy(() => import('./pages/ai/QuizPage.jsx'));
const MyStudyPage = lazy(() => import('./pages/ai/MyStudyPage.jsx'));

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '45vh' }}>
      <CircularProgress size={32} />
    </Box>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* ── Public routes ─────────────────────────────────────────── */}
          <Route path="/terms" element={<RulesPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/recover" element={<RecoverPasswordPage />} />
            <Route path="/forgot-password" element={<RecoverPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/reset/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* ── Private routes ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/repositories/new" element={<RepositoryFormPage />} />
              <Route path="/repositories/:id" element={<RepositoryDetailPage />} />
              <Route path="/repositories/:id/edit" element={<RepositoryFormPage />} />
              <Route path="/repositories/:id/upload" element={<UploadDocumentPage />} />
              <Route path="/documents/:id" element={<DocumentDetailPage />} />
              <Route path="/documents/:id/edit" element={<EditDocumentPage />} />

              {/* ── Placeholders of the side menu ─────────────────────────
                  Their views are not implemented yet, so they render the
                  error page inside the layout to keep the menu visible.
                  Each one is replaced when its story lands. */}
              <Route path="/search" element={<SearchPage />} />
              <Route path="/my-content" element={<MyContentPage />} />
              <Route path="/my-subjects" element={<MySubjectsPage />} />
              <Route path="/statistics" element={<MyStatisticsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/ai" element={<AiStudyPage />} />
              <Route path="/ai/my-study" element={<MyStudyPage />} />
              <Route path="/ia/mi-estudio" element={<MyStudyPage />} />
              <Route path="/ai/quiz/:id" element={<QuizPage />} />
              <Route path="/ia/cuestionario/:id" element={<QuizPage />} />
              <Route path="/ai/material/:id" element={<AiMaterialPage />} />
              <Route path="/ia/material/:id" element={<AiMaterialPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:username" element={<PublicProfilePage />} />
              <Route path="/friends" element={<FriendsPage />} />
            </Route>
          </Route>

          {/* ── Admin routes ───────────────────────────────────────────── */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/reports" element={<ReportInboxPage />} />
              <Route path="/admin/reports/:id" element={<ReportDetailPage />} />
              <Route path="/admin/users/:id" element={<AdminUserPage />} />

              <Route
                path="/admin/statistics"
                element={<GlobalStatisticsPage />}
              />
            </Route>
          </Route>

          {/* ── Errors ────────────────────────────────────────────────── */}
          <Route path="/403" element={<ErrorPage code={403} />} />
          <Route path="*" element={<ErrorPage code={404} />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
