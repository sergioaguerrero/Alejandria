/**
 * @file statisticsService.js
 * @description User personal statistics (FE-25, RF-60, RF-61, endpoint BE-22).
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
