/**
 * @file documents.js
 * @description Example documents associated with the repositories (FE-02).
 *
 * The sample PDF lives in public/docs/example-notes.pdf and is used
 * to test the preview of view 10.
 */

/**
 * @typedef {object} StoredFile
 * @property {string} name
 * @property {'pdf'|'docx'|'pptx'|'xlsx'|'jpg'|'png'} extension
 * @property {string} mime
 * @property {number} sizeBytes
 * @property {string} url
 */

/**
 * @typedef {object} Document
 * @property {string} id
 * @property {string} repositoryId
 * @property {string} title
 * @property {string} description
 * @property {'apunte'|'guia'|'resumen'|'proyecto'} type
 * @property {1|2|3} term
 * @property {string} topic
 * @property {string[]} tags
 * @property {StoredFile} file
 * @property {string} authorUsername
 * @property {number} views
 * @property {number} downloads
 * @property {number} likes
 * @property {string} createdAt
 */

const SAMPLE_PDF = '/docs/example-notes.pdf';

/** @type {Document[]} */
export const DOCUMENTS = [
  // ── repository-001 · Programación II ──────────────────────────────────────────
  {
    id: 'doc-001',
    repositoryId: 'repository-001',
    title: 'Taller de arreglos y matrices resuelto',
    description:
      'Los 12 ejercicios del taller con su solución comentada y la traza de ejecución de cada uno.',
    type: 'guia',
    term: 1,
    topic: 'Arreglos y matrices',
    tags: ['taller', 'ejercicios', 'poo'],
    file: {
      name: 'taller-arreglos.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 348_115,
      url: SAMPLE_PDF,
    },
    authorUsername: 'sergioaguerrero',
    views: 128,
    downloads: 41,
    likes: 12,
    createdAt: '2026-08-13T09:30:00.000Z',
  },
  {
    id: 'doc-002',
    repositoryId: 'repository-001',
    title: 'Apuntes de recursividad paso a paso',
    description:
      'Qué es la recursividad, caso base, caso recursivo y cómo dibujar el árbol de llamadas.',
    type: 'apunte',
    term: 2,
    topic: 'Recursividad',
    tags: ['apunte', 'algoritmos', 'repaso'],
    file: {
      name: 'apuntes-recursividad.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 512_004,
      url: SAMPLE_PDF,
    },
    authorUsername: 'sergioaguerrero',
    views: 210,
    downloads: 87,
    likes: 19,
    createdAt: '2026-09-02T15:10:00.000Z',
  },
  {
    id: 'doc-003',
    repositoryId: 'repository-001',
    title: 'Parcial 2 resuelto — listas enlazadas',
    description: 'Solución del parcial con la justificación de cada método implementado.',
    type: 'resumen',
    term: 2,
    topic: 'Listas enlazadas',
    tags: ['parcial', 'repaso'],
    file: {
      name: 'parcial-2-listas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 289_440,
      url: SAMPLE_PDF,
    },
    authorUsername: 'sergioaguerrero',
    views: 342,
    downloads: 156,
    likes: 28,
    createdAt: '2026-09-24T18:00:00.000Z',
  },

  // ── repository-002 · Bases de Datos I ─────────────────────────────────────────
  {
    id: 'doc-004',
    repositoryId: 'repository-002',
    title: 'Modelo entidad-relación del sistema de biblioteca',
    description:
      'Diagrama completo con entidades, atributos, relaciones y cardinalidades del caso de estudio.',
    type: 'proyecto',
    term: 1,
    topic: 'Modelado E-R',
    tags: ['laboratorio', 'repaso'],
    file: {
      name: 'modelo-er-biblioteca.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 734_912,
      url: SAMPLE_PDF,
    },
    authorUsername: 'lauramartinez',
    views: 189,
    downloads: 64,
    likes: 21,
    createdAt: '2026-08-16T11:00:00.000Z',
  },
  {
    id: 'doc-005',
    repositoryId: 'repository-002',
    title: 'Normalización hasta tercera forma normal',
    description:
      'Ejemplos de 1FN, 2FN y 3FN sobre la misma tabla, con el paso a paso de cada descomposición.',
    type: 'guia',
    term: 2,
    topic: 'Normalización',
    tags: ['sql', 'taller', 'formulas'],
    file: {
      name: 'normalizacion-3fn.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 402_180,
      url: SAMPLE_PDF,
    },
    authorUsername: 'lauramartinez',
    views: 275,
    downloads: 118,
    likes: 33,
    createdAt: '2026-09-05T16:25:00.000Z',
  },
  {
    id: 'doc-006',
    repositoryId: 'repository-002',
    title: 'Consultas SQL del parcial (JOIN, GROUP BY, subconsultas)',
    description: 'Las 10 consultas del parcial resueltas y explicadas línea por línea.',
    type: 'resumen',
    term: 3,
    topic: 'Consultas SQL',
    tags: ['sql', 'parcial', 'ejercicios'],
    file: {
      name: 'consultas-sql-parcial.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 265_701,
      url: SAMPLE_PDF,
    },
    authorUsername: 'lauramartinez',
    views: 431,
    downloads: 207,
    likes: 45,
    createdAt: '2026-10-20T16:40:00.000Z',
  },

  // ── repository-003 · Cálculo Integral ─────────────────────────────────────────
  {
    id: 'doc-007',
    repositoryId: 'repository-003',
    title: 'Guía de integración por partes',
    description: 'Teoría breve, los casos típicos y 20 ejercicios con respuesta.',
    type: 'guia',
    term: 1,
    topic: 'Integración por partes',
    tags: ['formulas', 'ejercicios', 'repaso'],
    file: {
      name: 'guia-integracion-partes.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 318_220,
      url: SAMPLE_PDF,
    },
    authorUsername: 'andrespineda',
    views: 96,
    downloads: 38,
    likes: 6,
    createdAt: '2026-08-21T08:45:00.000Z',
  },
  {
    id: 'doc-008',
    repositoryId: 'repository-003',
    title: 'Taller de integrales impropias',
    description: 'Convergencia, divergencia y comparación directa con ejercicios tipo parcial.',
    type: 'guia',
    term: 3,
    topic: 'Integrales impropias',
    tags: ['taller', 'final'],
    file: {
      name: 'taller-impropias.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 297_540,
      url: SAMPLE_PDF,
    },
    authorUsername: 'andrespineda',
    views: 74,
    downloads: 22,
    likes: 4,
    createdAt: '2026-10-11T11:15:00.000Z',
  },

  // ── repository-004 · Programación I ───────────────────────────────────────────
  {
    id: 'doc-009',
    repositoryId: 'repository-004',
    title: 'Ejercicios de condicionales en Java',
    description: '20 ejercicios con if/else y switch, solución y salida esperada.',
    type: 'guia',
    term: 1,
    topic: 'Condicionales',
    tags: ['ejercicios', 'poo'],
    file: {
      name: 'ejercicios-condicionales.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 210_944,
      url: SAMPLE_PDF,
    },
    authorUsername: 'camilodaza',
    views: 512,
    downloads: 231,
    likes: 56,
    createdAt: '2026-08-06T19:20:00.000Z',
  },
  {
    id: 'doc-010',
    repositoryId: 'repository-004',
    title: 'Presentación: introducción a los ciclos',
    description: 'Diapositivas de clase sobre for, while y do-while con ejemplos.',
    type: 'apunte',
    term: 2,
    topic: 'Ciclos',
    tags: ['apunte', 'repaso'],
    file: {
      name: 'ciclos-introduccion.pptx',
      extension: 'pptx',
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      sizeBytes: 1_204_224,
      url: '/docs/ciclos-introduccion.pptx',
    },
    authorUsername: 'camilodaza',
    views: 340,
    downloads: 98,
    likes: 27,
    createdAt: '2026-09-14T07:55:00.000Z',
  },

  // ── repository-005 · Estructuras de Datos ─────────────────────────────────────
  {
    id: 'doc-011',
    repositoryId: 'repository-005',
    title: 'Implementación de pilas y colas en C++',
    description: 'Código completo de pila y cola con arreglos y con listas enlazadas.',
    type: 'proyecto',
    term: 1,
    topic: 'Pilas y colas',
    tags: ['laboratorio', 'algoritmos', 'poo'],
    file: {
      name: 'pilas-y-colas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 486_310,
      url: SAMPLE_PDF,
    },
    authorUsername: 'valentinarojas',
    views: 164,
    downloads: 72,
    likes: 15,
    createdAt: '2026-08-23T13:50:00.000Z',
  },
  {
    id: 'doc-012',
    repositoryId: 'repository-005',
    title: 'Recorridos de árboles binarios (inorden, preorden, postorden)',
    description: 'Explicación gráfica de los tres recorridos y su implementación recursiva.',
    type: 'apunte',
    term: 3,
    topic: 'Árboles binarios',
    tags: ['algoritmos', 'repaso'],
    file: {
      name: 'recorridos-arboles.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 377_128,
      url: SAMPLE_PDF,
    },
    authorUsername: 'valentinarojas',
    views: 223,
    downloads: 91,
    likes: 24,
    createdAt: '2026-10-19T18:30:00.000Z',
  },

  // ── repository-006 · Redes ────────────────────────────────────────────────────
  {
    id: 'doc-013',
    repositoryId: 'repository-006',
    title: 'Laboratorio de subnetting con Packet Tracer',
    description: 'Topología, tabla de direccionamiento y comandos usados en el laboratorio.',
    type: 'proyecto',
    term: 1,
    topic: 'Subnetting',
    tags: ['laboratorio', 'ejercicios'],
    file: {
      name: 'lab-subnetting.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 623_400,
      url: SAMPLE_PDF,
    },
    authorUsername: 'valentinarojas',
    views: 118,
    downloads: 44,
    likes: 9,
    createdAt: '2026-08-29T15:30:00.000Z',
  },

  // ── repository-007 · Ingeniería de Software I ─────────────────────────────────
  {
    id: 'doc-014',
    repositoryId: 'repository-007',
    title: 'Plantilla de historias de usuario',
    description: 'Formato acordado en clase para redactar historias y criterios de aceptación.',
    type: 'guia',
    term: 1,
    topic: 'Historias de usuario',
    tags: ['taller', 'repaso'],
    file: {
      name: 'plantilla-historias.docx',
      extension: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 88_320,
      url: '/docs/plantilla-historias.docx',
    },
    authorUsername: 'danielaospino',
    views: 97,
    downloads: 51,
    likes: 8,
    createdAt: '2026-09-02T09:10:00.000Z',
  },
  {
    id: 'doc-015',
    repositoryId: 'repository-007',
    title: 'Diagramas UML del proyecto integrador',
    description: 'Casos de uso, clases y secuencia del módulo de préstamos.',
    type: 'proyecto',
    term: 2,
    topic: 'UML',
    tags: ['laboratorio', 'repaso'],
    file: {
      name: 'uml-proyecto.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 812_004,
      url: SAMPLE_PDF,
    },
    authorUsername: 'danielaospino',
    views: 143,
    downloads: 37,
    likes: 11,
    createdAt: '2026-10-16T10:25:00.000Z',
  },

  // ── repository-008 · Bases de Datos II ────────────────────────────────────────
  {
    id: 'doc-016',
    repositoryId: 'repository-008',
    title: 'Scripts de triggers y procedimientos en Oracle',
    description: 'Scripts listos para ejecutar en SQL Developer, con comentarios de cada bloque.',
    type: 'proyecto',
    term: 2,
    topic: 'PL/SQL',
    tags: ['sql', 'laboratorio'],
    file: {
      name: 'scripts-plsql.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 549_220,
      url: SAMPLE_PDF,
    },
    authorUsername: 'lauramartinez',
    views: 205,
    downloads: 112,
    likes: 19,
    createdAt: '2026-09-04T17:40:00.000Z',
  },
  {
    id: 'doc-017',
    repositoryId: 'repository-008',
    title: 'Hoja de cálculo de seguimiento de consultas',
    description: 'Plantilla para registrar tiempos de ejecución de las consultas del taller.',
    type: 'guia',
    term: 3,
    topic: 'Optimización',
    tags: ['taller', 'formulas'],
    file: {
      name: 'seguimiento-consultas.xlsx',
      extension: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: 42_176,
      url: '/docs/seguimiento-consultas.xlsx',
    },
    authorUsername: 'lauramartinez',
    views: 66,
    downloads: 29,
    likes: 3,
    createdAt: '2026-10-21T20:10:00.000Z',
  },

  // ── repository-009 · Inteligencia Artificial ──────────────────────────────────
  {
    id: 'doc-018',
    repositoryId: 'repository-009',
    title: 'Búsqueda A* explicada con un ejemplo',
    description: 'Heurísticas admisibles, costo acumulado y desarrollo paso a paso del algoritmo.',
    type: 'apunte',
    term: 1,
    topic: 'Búsqueda A*',
    tags: ['algoritmos', 'repaso'],
    file: {
      name: 'busqueda-a-estrella.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 401_560,
      url: SAMPLE_PDF,
    },
    authorUsername: 'sergioaguerrero',
    views: 132,
    downloads: 47,
    likes: 13,
    createdAt: '2026-09-11T11:50:00.000Z',
  },

  // ── repository-010 · Cálculo Diferencial ──────────────────────────────────────
  {
    id: 'doc-019',
    repositoryId: 'repository-010',
    title: 'Taller de límites con respuesta',
    description: 'Límites laterales, al infinito y por definición. Incluye respuestas.',
    type: 'guia',
    term: 1,
    topic: 'Límites',
    tags: ['taller', 'ejercicios'],
    file: {
      name: 'taller-limites.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 255_880,
      url: SAMPLE_PDF,
    },
    authorUsername: 'camilodaza',
    views: 88,
    downloads: 33,
    likes: 5,
    createdAt: '2026-09-13T08:20:00.000Z',
  },
  {
    id: 'doc-020',
    repositoryId: 'repository-010',
    title: 'Formulario de derivadas',
    description: 'Reglas de derivación en una sola página, listo para imprimir.',
    type: 'resumen',
    term: 2,
    topic: 'Derivadas',
    tags: ['formulas', 'repaso', 'quiz'],
    file: {
      name: 'formulario-derivadas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      sizeBytes: 164_320,
      url: SAMPLE_PDF,
    },
    authorUsername: 'camilodaza',
    views: 176,
    downloads: 94,
    likes: 17,
    createdAt: '2026-10-09T09:45:00.000Z',
  },
];
