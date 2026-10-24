/**
 * @file subjects.js
 * @description Example academic catalog (FE-02).
 *
 * Temporary data until the catalog endpoint exists (BE-03).
 * They correspond to the Systems Engineering curriculum of UPC.
 */

/** @typedef {{ id: number, name: string, semester: number }} Subject */

/** @type {Subject[]} */
export const SUBJECTS = [
  // ── Semester 1 ──────────────────────────────────────────────────────────
  { id: 1, name: 'Cálculo Diferencial', semester: 1 },
  { id: 2, name: 'Álgebra Lineal', semester: 1 },
  { id: 3, name: 'Introducción a la Ingeniería de Sistemas', semester: 1 },
  { id: 4, name: 'Programación I', semester: 1 },
  { id: 5, name: 'Competencias Comunicativas', semester: 1 },

  // ── Semester 2 ──────────────────────────────────────────────────────────
  { id: 6, name: 'Cálculo Integral', semester: 2 },
  { id: 7, name: 'Física Mecánica', semester: 2 },
  { id: 8, name: 'Matemáticas Discretas', semester: 2 },
  { id: 9, name: 'Programación II', semester: 2 },
  { id: 10, name: 'Estadística Descriptiva', semester: 2 },

  // ── Semester 3 ──────────────────────────────────────────────────────────
  { id: 11, name: 'Cálculo Multivariado', semester: 3 },
  { id: 12, name: 'Física Electromagnética', semester: 3 },
  { id: 13, name: 'Estructuras de Datos', semester: 3 },
  { id: 14, name: 'Bases de Datos I', semester: 3 },
  { id: 15, name: 'Probabilidad', semester: 3 },

  // ── Semester 4 ──────────────────────────────────────────────────────────
  { id: 16, name: 'Ecuaciones Diferenciales', semester: 4 },
  { id: 17, name: 'Arquitectura de Computadores', semester: 4 },
  { id: 18, name: 'Bases de Datos II', semester: 4 },
  { id: 19, name: 'Programación III', semester: 4 },
  { id: 20, name: 'Investigación de Operaciones', semester: 4 },

  // ── Semester 5 ──────────────────────────────────────────────────────────
  { id: 21, name: 'Sistemas Operativos', semester: 5 },
  { id: 22, name: 'Redes de Computadores', semester: 5 },
  { id: 23, name: 'Ingeniería de Software I', semester: 5 },
  { id: 24, name: 'Análisis de Algoritmos', semester: 5 },
  { id: 25, name: 'Estadística Inferencial', semester: 5 },

  // ── Semester 6 ──────────────────────────────────────────────────────────
  { id: 26, name: 'Compiladores', semester: 6 },
  { id: 27, name: 'Ingeniería de Software II', semester: 6 },
  { id: 28, name: 'Redes Avanzadas', semester: 6 },
  { id: 29, name: 'Inteligencia Artificial', semester: 6 },
  { id: 30, name: 'Electiva Profesional I', semester: 6 },

  // ── Semester 7 ──────────────────────────────────────────────────────────
  { id: 31, name: 'Sistemas Distribuidos', semester: 7 },
  { id: 32, name: 'Seguridad Informática', semester: 7 },
  { id: 33, name: 'Gestión de Bases de Datos', semester: 7 },
  { id: 34, name: 'Electiva Profesional II', semester: 7 },
  { id: 35, name: 'Metodología de la Investigación', semester: 7 },

  // ── Semester 8 ──────────────────────────────────────────────────────────
  { id: 36, name: 'Big Data', semester: 8 },
  { id: 37, name: 'Desarrollo Web', semester: 8 },
  { id: 38, name: 'Auditoría de Sistemas', semester: 8 },
  { id: 39, name: 'Electiva Profesional III', semester: 8 },
  { id: 40, name: 'Ética Profesional', semester: 8 },

  // ── Semester 9 ──────────────────────────────────────────────────────────
  { id: 41, name: 'Machine Learning', semester: 9 },
  { id: 42, name: 'Arquitectura de Software', semester: 9 },
  { id: 43, name: 'Gerencia de Proyectos TI', semester: 9 },
  { id: 44, name: 'Electiva Profesional IV', semester: 9 },
  { id: 45, name: 'Trabajo de Grado I', semester: 9 },

  // ── Semester 10 ─────────────────────────────────────────────────────────
  { id: 46, name: 'Computación en la Nube', semester: 10 },
  { id: 47, name: 'Emprendimiento e Innovación', semester: 10 },
  { id: 48, name: 'Electiva Profesional V', semester: 10 },
  { id: 49, name: 'Trabajo de Grado II', semester: 10 },
  { id: 50, name: 'Práctica Profesional', semester: 10 },
];
