/**
 * @file repos.js
 * @description Repositorios de estudio de ejemplo (FE-02).
 */

/**
 * @typedef {object} Repo
 * @property {string} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {number} materiaId
 * @property {string} autorUsername
 * @property {number} likes
 * @property {string} creadoEn        ISO 8601
 * @property {string} actualizadoEn   ISO 8601
 */

/** @type {Repo[]} */
export const REPOS = [
  {
    id: 'repo-001',
    nombre: 'Programación II — Estructuras básicas',
    descripcion:
      'Apuntes de clase, talleres resueltos y ejercicios de arreglos, listas y recursividad vistos con el profe en el semestre.',
    materiaId: 9,
    autorUsername: 'sergioaguerrero',
    likes: 14,
    creadoEn: '2026-08-12T14:20:00.000Z',
    actualizadoEn: '2026-10-18T09:05:00.000Z',
  },
  {
    id: 'repo-002',
    nombre: 'Bases de Datos I — Talleres y parciales resueltos',
    descripcion:
      'Modelado entidad-relación, normalización hasta 3FN y consultas SQL con ejemplos reales del parcial.',
    materiaId: 14,
    autorUsername: 'lauramartinez',
    likes: 23,
    creadoEn: '2026-08-15T10:00:00.000Z',
    actualizadoEn: '2026-10-20T16:40:00.000Z',
  },
  {
    id: 'repo-003',
    nombre: 'Cálculo Integral — Guías y repasos',
    descripcion:
      'Guías del profesor Rojas, talleres de integración por partes y repaso de integrales impropias.',
    materiaId: 6,
    autorUsername: 'andrespineda',
    likes: 9,
    creadoEn: '2026-08-20T08:30:00.000Z',
    actualizadoEn: '2026-10-11T11:15:00.000Z',
  },
  {
    id: 'repo-004',
    nombre: 'Programación I — Ejercicios en Java',
    descripcion:
      'Desde variables y condicionales hasta ciclos y métodos. Todo con solución y explicación paso a paso.',
    materiaId: 4,
    autorUsername: 'camilodaza',
    likes: 31,
    creadoEn: '2026-08-05T19:10:00.000Z',
    actualizadoEn: '2026-10-22T07:50:00.000Z',
  },
  {
    id: 'repo-005',
    nombre: 'Estructuras de Datos — Implementaciones en C++',
    descripcion:
      'Pilas, colas, listas enlazadas y árboles binarios implementados desde cero, con pruebas de escritorio.',
    materiaId: 13,
    autorUsername: 'valentinarojas',
    likes: 18,
    creadoEn: '2026-08-22T13:45:00.000Z',
    actualizadoEn: '2026-10-19T18:30:00.000Z',
  },
  {
    id: 'repo-006',
    nombre: 'Redes de Computadores — Laboratorios en Packet Tracer',
    descripcion:
      'Configuración de VLAN, enrutamiento estático y subnetting con los archivos .pkt de cada laboratorio.',
    materiaId: 22,
    autorUsername: 'valentinarojas',
    likes: 12,
    creadoEn: '2026-08-28T15:20:00.000Z',
    actualizadoEn: '2026-10-14T12:00:00.000Z',
  },
  {
    id: 'repo-007',
    nombre: 'Ingeniería de Software I — Documentación del proyecto',
    descripcion:
      'Historias de usuario, diagramas UML y plantillas de documentación para el proyecto integrador.',
    materiaId: 23,
    autorUsername: 'danielaospino',
    likes: 7,
    creadoEn: '2026-09-01T09:00:00.000Z',
    actualizadoEn: '2026-10-16T10:25:00.000Z',
  },
  {
    id: 'repo-008',
    nombre: 'Bases de Datos II — PL/SQL y triggers',
    descripcion:
      'Procedimientos almacenados, funciones, cursores y triggers en Oracle, con scripts listos para SQL Developer.',
    materiaId: 18,
    autorUsername: 'lauramartinez',
    likes: 16,
    creadoEn: '2026-09-03T17:35:00.000Z',
    actualizadoEn: '2026-10-21T20:10:00.000Z',
  },
  {
    id: 'repo-009',
    nombre: 'Inteligencia Artificial — Talleres de búsqueda',
    descripcion:
      'Algoritmos de búsqueda no informada, A* y ejercicios de lógica difusa resueltos en Python.',
    materiaId: 29,
    autorUsername: 'sergioaguerrero',
    likes: 11,
    creadoEn: '2026-09-10T11:40:00.000Z',
    actualizadoEn: '2026-10-17T14:55:00.000Z',
  },
  {
    id: 'repo-010',
    nombre: 'Cálculo Diferencial — Límites y derivadas',
    descripcion:
      'Talleres de límites, derivadas por definición y reglas de derivación con ejercicios resueltos.',
    materiaId: 1,
    autorUsername: 'camilodaza',
    likes: 5,
    creadoEn: '2026-09-12T08:15:00.000Z',
    actualizadoEn: '2026-10-09T09:45:00.000Z',
  },
];
