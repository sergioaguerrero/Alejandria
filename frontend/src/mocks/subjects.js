/**
 * @file subjects.js
 * @description Academic catalog of the Systems Engineering program of UPC (FE-02).
 *
 * Real curriculum (pensum) grouped by semester, with the official subject code.
 * Temporary data until the catalog endpoint exists (BE-03); its shape matches
 * what that endpoint is expected to return.
 */

/** @typedef {{ id: number, code: string, name: string, semester: number }} Subject */

/** @type {Subject[]} */
export const SUBJECTS = [
  // ── Semester 1 ──────────────────────────────────────────────────────────
  { id: 1, code: 'SS407', name: 'Algoritmos y Fundamentos de Programación', semester: 1 },
  { id: 2, code: 'MT104', name: 'Cálculo Diferencial', semester: 1 },
  { id: 3, code: 'UPC01', name: 'Cátedra Upecista', semester: 1 },
  { id: 4, code: 'PG102', name: 'Comunicación Oral y Escrita I', semester: 1 },
  { id: 5, code: 'HM201', name: 'Humanidades I', semester: 1 },
  { id: 6, code: 'SS105', name: 'Introducción a la Ingeniería de Sistemas', semester: 1 },
  { id: 7, code: 'MT117', name: 'Lógica Matemática', semester: 1 },

  // ── Semester 2 ──────────────────────────────────────────────────────────
  { id: 8, code: 'UPC08', name: 'Actividad Deportiva', semester: 2 },
  { id: 9, code: 'MT301B', name: 'Álgebra Lineal', semester: 2 },
  { id: 10, code: 'MT303B', name: 'Cálculo Integral', semester: 2 },
  { id: 11, code: 'PG200', name: 'Comunicación Oral y Escrita II', semester: 2 },
  { id: 12, code: 'HM202', name: 'Humanidades II', semester: 2 },
  { id: 13, code: 'FS202', name: 'Mecánica', semester: 2 },
  { id: 14, code: 'SS200', name: 'Programación de Computadores I', semester: 2 },
  { id: 15, code: 'ID212', name: 'Tech English I', semester: 2 },

  // ── Semester 3 ──────────────────────────────────────────────────────────
  { id: 16, code: 'UPC09', name: 'Actividad Cultural', semester: 3 },
  { id: 17, code: 'MT331', name: 'Cálculo Multivariable', semester: 3 },
  { id: 18, code: 'FS400', name: 'Electromagnetismo', semester: 3 },
  { id: 19, code: 'MT403', name: 'Estadística Descriptiva e Inferencial', semester: 3 },
  { id: 20, code: 'SS301', name: 'Estructura de Datos', semester: 3 },
  { id: 21, code: 'SS300', name: 'Programación de Computadores II', semester: 3 },
  { id: 22, code: 'SS303', name: 'Semillero de Investigación', semester: 3 },
  { id: 23, code: 'ID341', name: 'Tech English II', semester: 3 },

  // ── Semester 4 ──────────────────────────────────────────────────────────
  { id: 24, code: 'ING301', name: 'Metodología de la Investigación', semester: 4 },
  { id: 25, code: 'SS463', name: 'Base de Datos', semester: 4 },
  { id: 26, code: 'MT402', name: 'Ecuaciones Diferenciales', semester: 4 },
  {
    id: 27,
    code: 'SS705',
    name: 'Electiva Ciencias Administrativas, Económicas y Contables',
    semester: 4,
  },
  { id: 28, code: 'AI432', name: 'Investigación de Operaciones', semester: 4 },
  { id: 29, code: 'FS329', name: 'Ondas', semester: 4 },
  { id: 30, code: 'SS462', name: 'Programación de Computadores III', semester: 4 },

  // ── Semester 5 ──────────────────────────────────────────────────────────
  { id: 31, code: 'ING302', name: 'Seminario de Investigación', semester: 5 },
  { id: 32, code: 'MT309B', name: 'Análisis Numérico', semester: 5 },
  { id: 33, code: 'SS500', name: 'Arquitectura de Computadores', semester: 5 },
  { id: 34, code: 'SS802', name: 'Base de Datos Avanzadas', semester: 5 },
  { id: 35, code: 'UPC23', name: 'Cátedra de la Paz', semester: 5 },
  { id: 36, code: 'SS502', name: 'Ingeniería de Software I', semester: 5 },
  { id: 37, code: 'SS501', name: 'Programación Web', semester: 5 },

  // ── Semester 6 ──────────────────────────────────────────────────────────
  { id: 38, code: 'UPC25', name: 'Cátedra Ambiental y Desarrollo Sostenible', semester: 6 },
  { id: 39, code: 'SS602', name: 'Ingeniería de Software II', semester: 6 },
  { id: 40, code: 'AI700', name: 'Ingeniería Económica', semester: 6 },
  { id: 41, code: 'SS604', name: 'Innovación y Emprendimiento Tecnológico', semester: 6 },
  { id: 42, code: 'SS601', name: 'Modelos y Simulación', semester: 6 },
  { id: 43, code: 'SS603', name: 'Programación Móvil', semester: 6 },
  { id: 44, code: 'SS600', name: 'Sistemas Operativos', semester: 6 },

  // ── Semester 7 ──────────────────────────────────────────────────────────
  { id: 45, code: 'UPC24', name: 'Cátedra de Emprendimiento', semester: 7 },
  { id: 46, code: 'FC407', name: 'Formulación y Evaluación de Proyectos en Ingeniería', semester: 7 },
  { id: 47, code: 'SS706', name: 'Ingeniería de Software III', semester: 7 },
  { id: 48, code: 'SS702', name: 'Inteligencia Artificial', semester: 7 },
  { id: 49, code: 'SS701', name: 'Redes y Comunicaciones', semester: 7 },
  { id: 50, code: 'SS708', name: 'Research Project', semester: 7 },
  { id: 51, code: 'SS707', name: 'Tecnologías Inmersivas', semester: 7 },

  // ── Semester 8 ──────────────────────────────────────────────────────────
  { id: 52, code: 'SS810', name: 'Electiva Básica de Ingeniería', semester: 8 },
  { id: 53, code: 'SS811', name: 'Ética Profesional', semester: 8 },
  { id: 54, code: 'SS809', name: 'Gestión de Proyectos TI', semester: 8 },
  { id: 55, code: 'SS807', name: 'Optativa de Profundización I', semester: 8 },
  { id: 56, code: 'SS808', name: 'Optativa de Profundización II', semester: 8 },
  { id: 57, code: 'SS812', name: 'Proyecto de Grado I', semester: 8 },
  { id: 58, code: 'SS806', name: 'Seguridad de la Información', semester: 8 },

  // ── Semester 9 ──────────────────────────────────────────────────────────
  { id: 59, code: 'SS906', name: 'Optativa de Profundización III', semester: 9 },
  { id: 60, code: 'SS907', name: 'Optativa de Profundización IV', semester: 9 },
  { id: 61, code: 'SS908', name: 'Optativa de Profundización V', semester: 9 },
  { id: 62, code: 'SS909', name: 'Trabajo de Grado II', semester: 9 },
];
