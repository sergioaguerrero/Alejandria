/**
 * @file notifications.js
 * @description Seed notification fixtures (FE-18, FE-19).
 */

/**
 * @typedef {object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {'new_content'|'warning'|'content_hidden'|'content_deleted'|'sanction'|'like'|'system'|'report_pending'} type
 * @property {string} title
 * @property {string} message
 * @property {string|null} targetUrl
 * @property {boolean} read
 * @property {string} createdAt
 */

/** @type {Notification[]} */
export const NOTIFICATIONS = [
  {
    id: 'notif-001',
    userId: 'usr-001',
    type: 'new_content',
    title: 'Nuevo documento en Algoritmos y Complejidad',
    message: 'Laura Martínez subió "Taller de Grafos y Dijkstra" a Algoritmos y Complejidad.',
    targetUrl: '/documents/doc-002',
    read: false,
    createdAt: '2026-10-28T14:30:00.000Z',
  },
  {
    id: 'notif-002',
    userId: 'usr-001',
    type: 'new_content',
    title: 'Nuevo repositorio en Cálculo Multivariable',
    message: 'Andrés Pineda creó el repositorio "Cálculo 3 - Parcial 2".',
    targetUrl: '/repositories/repo-003',
    read: false,
    createdAt: '2026-10-27T09:15:00.000Z',
  },
  {
    id: 'notif-003',
    userId: 'usr-001',
    type: 'warning',
    title: 'Advertencia sobre documento',
    message: 'Tu documento "Resumen Parcial" fue reportado por etiquetado incorrecto. Por favor actualízalo.',
    targetUrl: '/documents/doc-001',
    read: false,
    createdAt: '2026-10-26T18:00:00.000Z',
  },
  {
    id: 'notif-004',
    userId: 'usr-001',
    type: 'like',
    title: 'Nuevo me gusta',
    message: 'A Valentina Rojas le gustó tu documento "Guía de Programación Orientada a Objetos".',
    targetUrl: '/documents/doc-001',
    read: true,
    createdAt: '2026-10-25T11:20:00.000Z',
  },
  {
    id: 'notif-005',
    userId: 'usr-001',
    type: 'system',
    title: 'Bienvenido a Alejandría',
    message: 'Recuerda revisar las normas de uso antes de compartir nuevo material académico.',
    targetUrl: '/terms',
    read: true,
    createdAt: '2026-10-23T08:00:00.000Z',
  },
  {
    id: 'notif-006',
    userId: 'usr-900',
    type: 'report_pending',
    title: 'Nuevo reporte pendiente',
    message: 'Se ha reportado un documento por presunto contenido inapropiado.',
    targetUrl: '/admin/reports',
    read: false,
    createdAt: '2026-10-29T10:00:00.000Z',
  },
];
