/**
 * @file materias.js
 * @description Catálogo académico de ejemplo (FE-02).
 *
 * Datos temporales hasta que exista el endpoint del catálogo (BE-03).
 * Corresponden al pénsum de Ingeniería de Sistemas de la UPC.
 */

/** @typedef {{ id: number, nombre: string, semestre: number }} Materia */

/** @type {Materia[]} */
export const MATERIAS = [
  // ── Semestre 1 ──────────────────────────────────────────────────────────
  { id: 1, nombre: 'Cálculo Diferencial', semestre: 1 },
  { id: 2, nombre: 'Álgebra Lineal', semestre: 1 },
  { id: 3, nombre: 'Introducción a la Ingeniería de Sistemas', semestre: 1 },
  { id: 4, nombre: 'Programación I', semestre: 1 },
  { id: 5, nombre: 'Competencias Comunicativas', semestre: 1 },

  // ── Semestre 2 ──────────────────────────────────────────────────────────
  { id: 6, nombre: 'Cálculo Integral', semestre: 2 },
  { id: 7, nombre: 'Física Mecánica', semestre: 2 },
  { id: 8, nombre: 'Matemáticas Discretas', semestre: 2 },
  { id: 9, nombre: 'Programación II', semestre: 2 },
  { id: 10, nombre: 'Estadística Descriptiva', semestre: 2 },

  // ── Semestre 3 ──────────────────────────────────────────────────────────
  { id: 11, nombre: 'Cálculo Multivariado', semestre: 3 },
  { id: 12, nombre: 'Física Electromagnética', semestre: 3 },
  { id: 13, nombre: 'Estructuras de Datos', semestre: 3 },
  { id: 14, nombre: 'Bases de Datos I', semestre: 3 },
  { id: 15, nombre: 'Probabilidad', semestre: 3 },

  // ── Semestre 4 ──────────────────────────────────────────────────────────
  { id: 16, nombre: 'Ecuaciones Diferenciales', semestre: 4 },
  { id: 17, nombre: 'Arquitectura de Computadores', semestre: 4 },
  { id: 18, nombre: 'Bases de Datos II', semestre: 4 },
  { id: 19, nombre: 'Programación III', semestre: 4 },
  { id: 20, nombre: 'Investigación de Operaciones', semestre: 4 },

  // ── Semestre 5 ──────────────────────────────────────────────────────────
  { id: 21, nombre: 'Sistemas Operativos', semestre: 5 },
  { id: 22, nombre: 'Redes de Computadores', semestre: 5 },
  { id: 23, nombre: 'Ingeniería de Software I', semestre: 5 },
  { id: 24, nombre: 'Análisis de Algoritmos', semestre: 5 },
  { id: 25, nombre: 'Estadística Inferencial', semestre: 5 },

  // ── Semestre 6 ──────────────────────────────────────────────────────────
  { id: 26, nombre: 'Compiladores', semestre: 6 },
  { id: 27, nombre: 'Ingeniería de Software II', semestre: 6 },
  { id: 28, nombre: 'Redes Avanzadas', semestre: 6 },
  { id: 29, nombre: 'Inteligencia Artificial', semestre: 6 },
  { id: 30, nombre: 'Electiva Profesional I', semestre: 6 },

  // ── Semestre 7 ──────────────────────────────────────────────────────────
  { id: 31, nombre: 'Sistemas Distribuidos', semestre: 7 },
  { id: 32, nombre: 'Seguridad Informática', semestre: 7 },
  { id: 33, nombre: 'Gestión de Bases de Datos', semestre: 7 },
  { id: 34, nombre: 'Electiva Profesional II', semestre: 7 },
  { id: 35, nombre: 'Metodología de la Investigación', semestre: 7 },

  // ── Semestre 8 ──────────────────────────────────────────────────────────
  { id: 36, nombre: 'Big Data', semestre: 8 },
  { id: 37, nombre: 'Desarrollo Web', semestre: 8 },
  { id: 38, nombre: 'Auditoría de Sistemas', semestre: 8 },
  { id: 39, nombre: 'Electiva Profesional III', semestre: 8 },
  { id: 40, nombre: 'Ética Profesional', semestre: 8 },

  // ── Semestre 9 ──────────────────────────────────────────────────────────
  { id: 41, nombre: 'Machine Learning', semestre: 9 },
  { id: 42, nombre: 'Arquitectura de Software', semestre: 9 },
  { id: 43, nombre: 'Gerencia de Proyectos TI', semestre: 9 },
  { id: 44, nombre: 'Electiva Profesional IV', semestre: 9 },
  { id: 45, nombre: 'Trabajo de Grado I', semestre: 9 },

  // ── Semestre 10 ─────────────────────────────────────────────────────────
  { id: 46, nombre: 'Computación en la Nube', semestre: 10 },
  { id: 47, nombre: 'Emprendimiento e Innovación', semestre: 10 },
  { id: 48, nombre: 'Electiva Profesional V', semestre: 10 },
  { id: 49, nombre: 'Trabajo de Grado II', semestre: 10 },
  { id: 50, nombre: 'Práctica Profesional', semestre: 10 },
];
