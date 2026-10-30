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
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import RecoverPasswordPage from './pages/auth/RecoverPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import ErrorPage from './pages/error/ErrorPage.jsx';
import HomePage from './pages/home/HomePage.jsx';
import MyContentPage from './pages/content/MyContentPage.jsx';
import MySubjectsPage from './pages/subjects/MySubjectsPage.jsx';
import MyStatisticsPage from './pages/statistics/MyStatisticsPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';
import PublicProfilePage from './pages/profile/PublicProfilePage.jsx';
import ReportInboxPage from './pages/admin/ReportInboxPage.jsx';
import ReportDetailPage from './pages/admin/ReportDetailPage.jsx';
import AdminUserPage from './pages/admin/AdminUserPage.jsx';
import GlobalStatisticsPage from './pages/admin/GlobalStatisticsPage.jsx';
import AiStudyPage from './pages/ai/AiStudyPage.jsx';
import QuizPage from './pages/ai/QuizPage.jsx';
import RepositoryDetailPage from './pages/repositories/RepositoryDetailPage.jsx';
import RepositoryFormPage from './pages/repositories/RepositoryFormPage.jsx';
import RulesPage from './pages/rules/RulesPage.jsx';
import SearchPage from './pages/search/SearchPage.jsx';
import DocumentDetailPage from './pages/documents/DocumentDetailPage.jsx';
import EditDocumentPage from './pages/documents/EditDocumentPage.jsx';
import UploadDocumentPage from './pages/documents/UploadDocumentPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ─────────────────────────────────────────── */}
          <Route path="/terms" element={<RulesPage />} />

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
              <Route path="/ai/quiz/:id" element={<QuizPage />} />
              <Route path="/ia/cuestionario/:id" element={<QuizPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/users/:username" element={<PublicProfilePage />} />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
