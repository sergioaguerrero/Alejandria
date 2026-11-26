/**
 * @file index.js
 * @description Entry point of the services layer (FE-02).
 *
 * Screens import from here:
 *   import { getRepositories } from '../services';
 *
 * So, if tomorrow a service is split into several files, the screens
 * do not notice.
 */

export { USE_MOCK, API_URL } from './config.js';
export { ApiError, normalizeError } from './errors.js';
export { default as http } from './http.js';

export {
  login,
  register,
  verifyEmail,
  resendVerificationCode,
  logout,
  saveSession,
  getCurrentSession,
  currentUser,
  uploadProfileAvatar,
  deleteProfileAvatar,
  uploadProfileBanner,
  deleteProfileBanner,
  requestPasswordReset,
  resetPassword,
} from './authService.js';

export {
  getRepositories,
  getRepository,
  getRepositoriesByUser,
  createRepository,
  updateRepository,
  deleteRepository,
  toggleRepositoryLike,
  toggleFollowRepository,
  getFollowedRepositories,
  getRepositoryCollaborators,
  inviteCollaborator,
  respondCollaboratorInvitation,
  removeCollaborator,
  getMyCollaborations,
} from './repositoryService.js';

export {
  listByRepository,
  listSubjectTopics,
  getDocument,
  getDocuments,
  getDocumentsByUser,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from './documentService.js';

export {
  getSubjects,
  groupBySemester,
  getSubjectsOfInterest,
  updateSubjectsOfInterest,
} from './subjectService.js';

export {
  getMyStatistics,
  getGlobalStatistics,
  getAdvancedAdminStatistics,
} from './statisticsService.js';

export { createReport, getReports, getReportById, resolveReport } from './reportService.js';

export {
  getPublicProfile,
  getAdminUser,
  toggleUserSuspension,
  toggleFollowUser,
  getFriends,
  getFollowingUsers,
  getFollowerUsers,
  searchUsers,
} from './userService.js';

export {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notificationService.js';

export {
  getDailyAiQuota,
  generateQuiz,
  generateAiMaterial,
  getAiMaterialById,
  toggleSaveAiMaterialToMyStudy,
  getQuizById,
  submitQuizAnswers,
  toggleSaveQuizToMyStudy,
  getMyStudyMaterials,
  deleteFromMyStudy,
  getSharedFriendsForMaterial,
  shareAiContentWithFriends,
  getSharedWithMeAiMaterials,
} from './aiService.js';
