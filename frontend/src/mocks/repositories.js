/**
 * @file repositories.js
 * @description Example study repositories (FE-02).
 */

/**
 * @typedef {object} Repository
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} subjectId
 * @property {string} authorUsername
 * @property {number} likes
 * @property {string} createdAt        ISO 8601
 * @property {string} updatedAt   ISO 8601
 */

/** @type {Repository[]} */
export const REPOSITORIES = [
  {
    id: 'repository-001',
    name: 'Programación de Computadores II — Estructuras básicas',
    description:
      'Apuntes de clase, talleres resueltos y ejercicios de arreglos, listas y recursividad vistos con el profe en el semestre.',
    subjectId: 21,
    authorUsername: 'sergioaguerrero',
    likes: 14,
    createdAt: '2026-08-12T14:20:00.000Z',
    updatedAt: '2026-10-18T09:05:00.000Z',
  },
  {
    id: 'repository-002',
    name: 'Base de Datos — Talleres y parciales resueltos',
    description:
      'Modelado entidad-relación, normalización hasta 3FN y consultas SQL con ejemplos reales del parcial.',
    subjectId: 25,
    authorUsername: 'lauramartinez',
    likes: 23,
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-10-20T16:40:00.000Z',
  },
  {
    id: 'repository-003',
    name: 'Cálculo Integral — Guías y repasos',
    description:
      'Guías del profesor Rojas, talleres de integración por partes y repaso de integrales impropias.',
    subjectId: 10,
    authorUsername: 'andrespineda',
    likes: 9,
    createdAt: '2026-08-20T08:30:00.000Z',
    updatedAt: '2026-10-11T11:15:00.000Z',
  },
  {
    id: 'repository-004',
    name: 'Programación de Computadores I — Ejercicios en Java',
    description:
      'Desde variables y condicionales hasta ciclos y métodos. Todo con solución y explicación paso a paso.',
    subjectId: 14,
    authorUsername: 'camilodaza',
    likes: 31,
    createdAt: '2026-08-05T19:10:00.000Z',
    updatedAt: '2026-10-22T07:50:00.000Z',
  },
  {
    id: 'repository-005',
    name: 'Estructura de Datos — Implementaciones en C++',
    description:
      'Pilas, colas, listas enlazadas y árboles binarios implementados desde cero, con pruebas de escritorio.',
    subjectId: 20,
    authorUsername: 'valentinarojas',
    likes: 18,
    createdAt: '2026-08-22T13:45:00.000Z',
    updatedAt: '2026-10-19T18:30:00.000Z',
  },
  {
    id: 'repository-006',
    name: 'Redes y Comunicaciones — Laboratorios en Packet Tracer',
    description:
      'Configuración de VLAN, enrutamiento estático y subnetting con los archivos .pkt de cada laboratorio.',
    subjectId: 49,
    authorUsername: 'valentinarojas',
    likes: 12,
    createdAt: '2026-08-28T15:20:00.000Z',
    updatedAt: '2026-10-14T12:00:00.000Z',
  },
  {
    id: 'repository-007',
    name: 'Ingeniería de Software I — Documentación del proyecto',
    description:
      'Historias de usuario, diagramas UML y plantillas de documentación para el proyecto integrador.',
    subjectId: 36,
    authorUsername: 'danielaospino',
    likes: 7,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-10-16T10:25:00.000Z',
  },
  {
    id: 'repository-008',
    name: 'Base de Datos Avanzadas — PL/SQL y triggers',
    description:
      'Procedimientos almacenados, funciones, cursores y triggers en Oracle, con scripts listos para SQL Developer.',
    subjectId: 34,
    authorUsername: 'lauramartinez',
    likes: 16,
    createdAt: '2026-09-03T17:35:00.000Z',
    updatedAt: '2026-10-21T20:10:00.000Z',
  },
  {
    id: 'repository-009',
    name: 'Inteligencia Artificial — Talleres de búsqueda',
    description:
      'Algoritmos de búsqueda no informada, A* y ejercicios de lógica difusa resueltos en Python.',
    subjectId: 48,
    authorUsername: 'sergioaguerrero',
    likes: 11,
    createdAt: '2026-09-10T11:40:00.000Z',
    updatedAt: '2026-10-17T14:55:00.000Z',
  },
  {
    id: 'repository-010',
    name: 'Cálculo Diferencial — Límites y derivadas',
    description:
      'Talleres de límites, derivadas por definición y reglas de derivación con ejercicios resueltos.',
    subjectId: 2,
    authorUsername: 'camilodaza',
    likes: 5,
    createdAt: '2026-09-12T08:15:00.000Z',
    updatedAt: '2026-10-09T09:45:00.000Z',
  },
];
