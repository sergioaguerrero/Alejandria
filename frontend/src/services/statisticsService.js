/**
 * @file statisticsService.js
 * @description User personal and global platform statistics (FE-25, FE-26, FE-27, RF-60, RF-61, RF-62, RF-63).
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';

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

  const totalViews = userDocuments.reduce((acc, doc) => acc + (doc.views || 0), 0);
  const totalDownloads = userDocuments.reduce((acc, doc) => acc + (doc.downloads || 0), 0);
  const totalLikes = userDocuments.reduce((acc, doc) => acc + (doc.likes || 0), 0);

  // Mock activity history by week or month
  const activityData =
    period === 'week'
      ? [
          { name: 'Lun', vistas: 12, descargas: 4 },
          { name: 'Mar', vistas: 18, descargas: 7 },
          { name: 'Mié', vistas: 24, descargas: 11 },
          { name: 'Jue', vistas: 16, descargas: 5 },
          { name: 'Vie', vistas: 30, descargas: 14 },
          { name: 'Sáb', vistas: 9, descargas: 2 },
          { name: 'Dom', vistas: 15, descargas: 6 },
        ]
      : [
          { name: 'Sem 1', vistas: 85, descargas: 32 },
          { name: 'Sem 2', vistas: 110, descargas: 45 },
          { name: 'Sem 3', vistas: 95, descargas: 38 },
          { name: 'Sem 4', vistas: 130, descargas: 54 },
        ];

  // Most consulted subjects
  const topSubjects = [
    { subject: 'Bases de Datos', consultados: 18 },
    { subject: 'Programación III', consultados: 14 },
    { subject: 'Estructuras de Datos', consultados: 9 },
    { subject: 'Ingeniería de Software', consultados: 7 },
    { subject: 'Cálculo Multivariable', consultados: 5 },
  ];

  // Recent consulted documents history
  const recentHistory = store.documents.slice(0, 5).map((doc) => {
    const repo = store.repositories.find((r) => r.id === doc.repositoryId);
    return {
      id: doc.id,
      title: doc.title,
      repositoryName: repo?.name ?? 'Repositorio',
      date: doc.createdAt,
      type: doc.type,
    };
  });

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
      likes: doc.likes || 0,
      createdAt: doc.createdAt,
    })),
  };
}

/**
 * Gets global platform analytics for administrators (FE-26, BE-23).
 * @returns {Promise<object>}
 */
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

  const subjectViewsMap = new Map();
  for (const doc of store.documents) {
    const subjectName = doc.subject?.name || 'Otras';
    subjectViewsMap.set(subjectName, (subjectViewsMap.get(subjectName) || 0) + (doc.views || 0));
  }
  const topSubjects = Array.from(subjectViewsMap.entries())
    .map(([subject, vistas]) => ({ subject, vistas }))
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 5);

  const topicCounts = new Map();
  for (const doc of store.documents) {
    if (doc.topic) {
      topicCounts.set(doc.topic, (topicCounts.get(doc.topic) || 0) + 1);
    }
  }
  const topTopics = Array.from(topicCounts.entries())
    .map(([tema, documentos]) => ({ tema, documentos }))
    .sort((a, b) => b.documentos - a.documentos)
    .slice(0, 5);

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
    const name = doc.subject?.name || 'Sin materia';
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
      subjectName: doc.subject?.name || '—',
      views: doc.views || 0,
      downloads: doc.downloads || 0,
      likes: doc.likes || 0,
    }));

  const reasonsSummary = [
    {
      reason: 'Mal etiquetado',
      pendientes: store.reports.filter((r) => r.reason === 'mal-etiquetado' && r.status === 'pendiente').length,
      resueltos: store.reports.filter((r) => r.reason === 'mal-etiquetado' && r.status === 'resuelto').length,
    },
    {
      reason: 'Contenido duplicado',
      pendientes: store.reports.filter((r) => r.reason === 'duplicado' && r.status === 'pendiente').length,
      resueltos: store.reports.filter((r) => r.reason === 'duplicado' && r.status === 'resuelto').length,
    },
    {
      reason: 'Contenido inapropiado',
      pendientes: store.reports.filter((r) => r.reason === 'inapropiado' && r.status === 'pendiente').length,
      resueltos: store.reports.filter((r) => r.reason === 'inapropiado' && r.status === 'resuelto').length,
    },
  ];

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
