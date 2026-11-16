/**
 * @file statisticsService.js
 * @description User personal and global platform statistics (FE-25, FE-26, FE-27, RF-60, RF-61, RF-62, RF-63).
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';
import { REPORT_REASONS } from '../mocks/catalogs.js';
import { AI_CONTENT_TYPES, getAiContentMeta } from '../utils/aiContentMeta.js';
import { aggregateTopTopics } from '../utils/topics.js';

/**
 * Builds fast lookup helpers to resolve the subject name of a repository or
 * document in the mock store (documents only persist `repositoryId`).
 */
function createSubjectLookup() {
  const subjectsById = new Map(store.subjects.map((subject) => [Number(subject.id), subject.name]));
  const reposById = new Map(store.repositories.map((repo) => [repo.id, repo]));

  const fromRepository = (repo, fallback = 'Sin materia') => {
    if (!repo) return fallback;
    if (repo.subject?.name) return repo.subject.name;
    return subjectsById.get(Number(repo.subjectId)) ?? fallback;
  };

  const fromDocument = (doc, fallback = 'Sin materia') => {
    if (doc?.subject?.name) return doc.subject.name;
    return fromRepository(reposById.get(doc?.repositoryId), fallback);
  };

  return { fromRepository, fromDocument };
}

/**
 * Gets personal statistics for the logged-in user.
 * @param {'week'|'month'} [period='week']
 * @returns {Promise<object>}
 */
export async function getMyStatistics(period = 'week') {
  if (!USE_MOCK) {
    const { data } = await http.get('/users/me/statistics', { params: { period } });
    return data;
  }

  await waitForMock(300);

  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para consultar tus estadísticas.', { status: 401 });
  }

  const userDocuments = store.documents.filter((doc) => doc.authorUsername === user.username);
  const userRepositories = store.repositories.filter(
    (repo) => repo.authorUsername === user.username,
  );

  const totalViews = userDocuments.reduce((acc, doc) => acc + (doc.views || 0), 0);
  const totalDownloads = userDocuments.reduce((acc, doc) => acc + (doc.downloads || 0), 0);
  const totalLikes = userRepositories.reduce((acc, repo) => acc + (repo.likes || 0), 0);

  // Real view and download counts added to current day or week
  const todayDayIndex = new Date().getDay();
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const todayLabel = dayLabels[todayDayIndex];

  const baseWeek = [
    { name: 'Lun', vistas: 12, descargas: 4 },
    { name: 'Mar', vistas: 18, descargas: 7 },
    { name: 'Mié', vistas: 24, descargas: 11 },
    { name: 'Jue', vistas: 16, descargas: 5 },
    { name: 'Vie', vistas: 30, descargas: 14 },
    { name: 'Sáb', vistas: 9, descargas: 2 },
    { name: 'Dom', vistas: 15, descargas: 6 },
  ];

  const userDocIds = new Set(userDocuments.map((d) => d.id));
  const newInteractionsToday = (store.interactions || []).filter((i) => userDocIds.has(i.documentId));
  const extraViews = newInteractionsToday.filter((i) => i.type === 'view').length;
  const extraDownloads = newInteractionsToday.filter((i) => i.type === 'download').length;

  const activityData =
    period === 'week'
      ? baseWeek.map((day) =>
          day.name === todayLabel
            ? { ...day, vistas: day.vistas + extraViews, descargas: day.descargas + extraDownloads }
            : day,
        )
      : [
          { name: 'Sem 1', vistas: 85, descargas: 32 },
          { name: 'Sem 2', vistas: 110, descargas: 45 },
          { name: 'Sem 3', vistas: 95, descargas: 38 },
          { name: 'Sem 4', vistas: 130 + extraViews, descargas: 54 + extraDownloads },
        ];

  // Subject consultations: counts interactions by subject for this user + default subjects
  const subjectCounts = new Map();
  for (const inter of store.interactions || []) {
    if (inter.username === user.username && inter.subjectId) {
      const subj = store.subjects.find((s) => s.id === inter.subjectId);
      const name = subj?.name || 'Materia';
      subjectCounts.set(name, (subjectCounts.get(name) || 0) + 1);
    }
  }

  const defaultTop = [
    { subject: 'Bases de Datos', consultados: 18 },
    { subject: 'Programación III', consultados: 14 },
    { subject: 'Estructuras de Datos', consultados: 9 },
    { subject: 'Ingeniería de Software', consultados: 7 },
    { subject: 'Cálculo Multivariable', consultados: 5 },
  ];

  for (const item of defaultTop) {
    if (!subjectCounts.has(item.subject)) {
      subjectCounts.set(item.subject, item.consultados);
    } else {
      subjectCounts.set(item.subject, subjectCounts.get(item.subject) + item.consultados);
    }
  }

  const topSubjects = Array.from(subjectCounts.entries())
    .map(([subject, consultados]) => ({ subject, consultados }))
    .sort((a, b) => b.consultados - a.consultados)
    .slice(0, 5);

  // Recent consulted documents from real user interactions + fallback
  const userInteractions = (store.interactions || [])
    .filter((i) => i.username === user.username && (i.type === 'view' || i.type === 'download'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const interactedDocIds = Array.from(new Set(userInteractions.map((i) => i.documentId)));
  const recentHistory = [];

  for (const docId of interactedDocIds) {
    const doc = store.documents.find((d) => d.id === docId);
    if (doc) {
      const interaction = userInteractions.find((i) => i.documentId === docId);
      const repo = store.repositories.find((r) => r.id === doc.repositoryId);
      recentHistory.push({
        id: doc.id,
        title: doc.title,
        repositoryName: repo?.name ?? 'Repositorio',
        date: interaction?.createdAt ?? doc.createdAt,
        type: doc.type,
      });
    }
    if (recentHistory.length >= 5) break;
  }

  if (recentHistory.length < 5) {
    for (const doc of store.documents) {
      if (!recentHistory.some((r) => r.id === doc.id)) {
        const repo = store.repositories.find((r) => r.id === doc.repositoryId);
        recentHistory.push({
          id: doc.id,
          title: doc.title,
          repositoryName: repo?.name ?? 'Repositorio',
          date: doc.createdAt,
          type: doc.type,
        });
      }
      if (recentHistory.length >= 5) break;
    }
  }

  return {
    totals: {
      documentsUploaded: userDocuments.length,
      views: totalViews,
      downloads: totalDownloads,
      likes: totalLikes,
    },
    activity: activityData,
    topSubjects,
    recentHistory,
    myDocuments: userDocuments.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      views: doc.views || 0,
      downloads: doc.downloads || 0,
      createdAt: doc.createdAt,
    })),
  };
}

/**
 * Gets global platform analytics for administrators (FE-26, BE-23).
 * @returns {Promise<object>}
 */
/**
 * Gets advanced admin activity analytics filtered by period (FE-37, RF-64, RF-65, BE-25).
 * @param {'day'|'week'|'month'} [period='week']
 * @returns {Promise<object>}
 */
export async function getAdvancedAdminStatistics(period = 'week') {
  const user = currentUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError('No tienes permisos de administrador.', { status: 403 });
  }

  const activePeriod = ['day', 'week', 'month'].includes(period) ? period : 'week';

  if (!USE_MOCK) {
    const { data } = await http.get('/admin/statistics/advanced', {
      params: { period: activePeriod },
    });
    return data;
  }

  await waitForMock(200);

  const students = store.users.filter((u) => u.role !== 'admin');
  const totalStudents = students.length;

  const periodBuckets =
    activePeriod === 'day'
      ? ['day']
      : activePeriod === 'week'
        ? ['day', 'week']
        : ['day', 'week', 'month'];

  const allAiLogs = store.aiUsageLogs || [];
  const periodAiLogs = allAiLogs.filter((entry) => periodBuckets.includes(entry.periodBucket));

  // Active users per period baseline + live AI contributors
  const activeRatio = activePeriod === 'day' ? 0.5 : activePeriod === 'week' ? 0.84 : 1;
  const baselineActive = Math.min(totalStudents, Math.max(1, Math.round(totalStudents * activeRatio)));
  const activeTimelines = {
    day: [
      { label: '08:00', activos: 2, sesiones: 5 },
      { label: '11:00', activos: 3, sesiones: 9 },
      { label: '14:00', activos: 4, sesiones: 12 },
      { label: '17:00', activos: 3, sesiones: 10 },
      { label: '20:00', activos: 4, sesiones: 14 },
      { label: '23:00', activos: 2, sesiones: 6 },
    ],
    week: [
      { label: 'Lun', activos: 4, sesiones: 16 },
      { label: 'Mar', activos: 5, sesiones: 21 },
      { label: 'Mié', activos: 5, sesiones: 24 },
      { label: 'Jue', activos: 4, sesiones: 19 },
      { label: 'Vie', activos: 5, sesiones: 22 },
      { label: 'Sáb', activos: 3, sesiones: 11 },
      { label: 'Dom', activos: 4, sesiones: 15 },
    ],
    month: [
      { label: 'Sem 1', activos: 5, sesiones: 64 },
      { label: 'Sem 2', activos: 6, sesiones: 78 },
      { label: 'Sem 3', activos: 5, sesiones: 71 },
      { label: 'Sem 4', activos: 6, sesiones: 89 },
    ],
  };

  // Search terms ranking
  const sortedSearchTerms = [...(store.searchLogs || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const maxSearchCount = sortedSearchTerms[0]?.count || 1;
  const topSearchTerms = sortedSearchTerms.map((item) => ({
    term: item.term,
    count: item.count,
    sharePercent: Math.round((item.count / maxSearchCount) * 100),
  }));

  // AI usage stats by content type, repository, and timeline
  const typeCountsMap = new Map(AI_CONTENT_TYPES.map((t) => [t.value, 0]));
  const repoCountsMap = new Map();

  for (const log of periodAiLogs) {
    const tKey = typeCountsMap.has(log.contentType) ? log.contentType : 'quiz';
    typeCountsMap.set(tKey, (typeCountsMap.get(tKey) || 0) + 1);
    repoCountsMap.set(log.repositoryId, (repoCountsMap.get(log.repositoryId) || 0) + 1);
  }

  const byType = AI_CONTENT_TYPES.map((t) => ({
    contentType: t.value,
    label: getAiContentMeta(t.value).shortLabel,
    count: typeCountsMap.get(t.value) || 0,
  }));

  const resolveSubject = createSubjectLookup();
  const topRepositories = Array.from(repoCountsMap.entries())
    .map(([repoId, count]) => {
      const repo = store.repositories.find((r) => r.id === repoId);
      return {
        repositoryId: repoId,
        repositoryName: repo?.name ?? 'Repositorio eliminado',
        subjectName: resolveSubject.fromRepository(repo, 'Materia'),
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const liveTodayBoost = Math.max(0, periodAiLogs.length - allAiLogs.filter((e) => e.id.startsWith('ailog-0') || e.id === 'ailog-10').filter((e) => periodBuckets.includes(e.periodBucket)).length);

  const aiTimelines = {
    day: [
      { label: '08:00', generaciones: 1 },
      { label: '11:00', generaciones: 2 + liveTodayBoost },
      { label: '14:00', generaciones: 1 },
      { label: '17:00', generaciones: 2 },
      { label: '20:00', generaciones: 3 },
      { label: '23:00', generaciones: 1 },
    ],
    week: [
      { label: 'Lun', generaciones: 3 },
      { label: 'Mar', generaciones: 4 },
      { label: 'Mié', generaciones: 6 + liveTodayBoost },
      { label: 'Jue', generaciones: 3 },
      { label: 'Vie', generaciones: 5 },
      { label: 'Sáb', generaciones: 2 },
      { label: 'Dom', generaciones: 3 },
    ],
    month: [
      { label: 'Sem 1', generaciones: 14 },
      { label: 'Sem 2', generaciones: 19 },
      { label: 'Sem 3', generaciones: 16 },
      { label: 'Sem 4', generaciones: 24 + liveTodayBoost },
    ],
  };

  return {
    period: activePeriod,
    activeUsers: {
      totalActive: baselineActive,
      totalStudents,
      engagementRate: totalStudents > 0 ? Math.round((baselineActive / totalStudents) * 100) : 0,
      deltaLabel: activePeriod === 'day' ? '+8% vs. ayer' : activePeriod === 'week' ? '+14% vs. sem. anterior' : '+22% vs. mes anterior',
      timeline: activeTimelines[activePeriod],
    },
    topSearchTerms,
    aiUsage: {
      periodGenerations: periodAiLogs.length,
      totalGenerations: allAiLogs.length,
      sharedWithFriends: (store.aiShares || []).length,
      byType,
      topRepositories,
      timeline: aiTimelines[activePeriod],
    },
  };
}

export async function getGlobalStatistics() {
  const user = currentUser();
  if (!user || user.role !== 'admin') {
    throw new ApiError('Solo los administradores pueden consultar las estadísticas globales.', {
      status: 403,
    });
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/api/admin/statistics');
    return data;
  }

  await waitForMock(300);

  const activeStudents = store.users.filter((u) => u.role === 'estudiante' && !u.suspended).length;
  const totalRepositories = store.repositories.length;
  const totalDocuments = store.documents.length;
  const pendingReports = store.reports.filter((r) => r.status === 'pendiente').length;
  const resolvedReports = store.reports.filter((r) => r.status === 'resuelto').length;

  const resolveSubject = createSubjectLookup();
  const subjectViewsMap = new Map();
  for (const doc of store.documents) {
    const subjectName = resolveSubject.fromDocument(doc, 'Otras');
    subjectViewsMap.set(subjectName, (subjectViewsMap.get(subjectName) || 0) + (doc.views || 0));
  }
  const topSubjects = Array.from(subjectViewsMap.entries())
    .map(([subject, vistas]) => ({ subject, vistas }))
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 5);

  const topTopics = aggregateTopTopics(store.documents, 5);

  const semesterMap = new Map();
  for (let s = 1; s <= 10; s += 1) {
    semesterMap.set(s, 0);
  }
  for (const u of store.users) {
    if (u.role === 'estudiante' && u.semester && semesterMap.has(u.semester)) {
      semesterMap.set(u.semester, semesterMap.get(u.semester) + 1);
    }
  }
  const studentsBySemester = Array.from(semesterMap.entries())
    .map(([semestre, estudiantes]) => ({
      semestre: `Sem ${semestre}`,
      estudiantes,
    }))
    .filter((entry) => entry.estudiantes > 0 || Number(entry.semestre.split(' ')[1]) <= 6);

  const docsBySubjectMap = new Map();
  for (const doc of store.documents) {
    const name = resolveSubject.fromDocument(doc, 'Sin materia');
    docsBySubjectMap.set(name, (docsBySubjectMap.get(name) || 0) + 1);
  }
  const documentsBySubject = Array.from(docsBySubjectMap.entries())
    .map(([materia, documentos]) => ({ materia, documentos }))
    .sort((a, b) => b.documentos - a.documentos);

  const topDocuments = [...store.documents]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6)
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      subjectName: resolveSubject.fromDocument(doc, '—'),
      views: doc.views || 0,
      downloads: doc.downloads || 0,
    }));

  const reasonsSummary = REPORT_REASONS.map(({ value, label }) => ({
    reason: label,
    pendientes: store.reports.filter((r) => r.reason === value && r.status === 'pendiente').length,
    resueltos: store.reports.filter((r) => r.reason === value && r.status === 'resuelto').length,
  }));

  return {
    totals: {
      repositories: totalRepositories,
      documents: totalDocuments,
      activeStudents,
      totalReports: store.reports.length,
      pendingReports,
      resolvedReports,
    },
    topSubjects,
    topTopics,
    studentsBySemester,
    documentsBySubject,
    topDocuments,
    reasonsSummary,
  };
}
