/**
 * @file documentos.js
 * @description Documentos de ejemplo asociados a los repositorios (FE-02).
 *
 * El PDF de muestra vive en public/docs/ejemplo-apunte.pdf y sirve
 * para probar la previsualización de la vista 10.
 */

/**
 * @typedef {object} Archivo
 * @property {string} nombre
 * @property {'pdf'|'docx'|'pptx'|'xlsx'|'jpg'|'png'} extension
 * @property {string} mime
 * @property {number} tamanoBytes
 * @property {string} url
 */

/**
 * @typedef {object} Documento
 * @property {string} id
 * @property {string} repoId
 * @property {string} titulo
 * @property {string} descripcion
 * @property {'apunte'|'guia'|'resumen'|'proyecto'} tipo
 * @property {1|2|3} corte
 * @property {string} tema
 * @property {string[]} etiquetas
 * @property {Archivo} archivo
 * @property {string} autorUsername
 * @property {number} vistas
 * @property {number} descargas
 * @property {number} likes
 * @property {string} creadoEn
 */

const PDF_MUESTRA = '/docs/ejemplo-apunte.pdf';

/** @type {Documento[]} */
export const DOCUMENTOS = [
  // ── repo-001 · Programación II ──────────────────────────────────────────
  {
    id: 'doc-001',
    repoId: 'repo-001',
    titulo: 'Taller de arreglos y matrices resuelto',
    descripcion:
      'Los 12 ejercicios del taller con su solución comentada y la traza de ejecución de cada uno.',
    tipo: 'guia',
    corte: 1,
    tema: 'Arreglos y matrices',
    etiquetas: ['taller', 'ejercicios', 'poo'],
    archivo: {
      nombre: 'taller-arreglos.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 348_115,
      url: PDF_MUESTRA,
    },
    autorUsername: 'sergioaguerrero',
    vistas: 128,
    descargas: 41,
    likes: 12,
    creadoEn: '2026-08-13T09:30:00.000Z',
  },
  {
    id: 'doc-002',
    repoId: 'repo-001',
    titulo: 'Apuntes de recursividad paso a paso',
    descripcion:
      'Qué es la recursividad, caso base, caso recursivo y cómo dibujar el árbol de llamadas.',
    tipo: 'apunte',
    corte: 2,
    tema: 'Recursividad',
    etiquetas: ['apunte', 'algoritmos', 'repaso'],
    archivo: {
      nombre: 'apuntes-recursividad.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 512_004,
      url: PDF_MUESTRA,
    },
    autorUsername: 'sergioaguerrero',
    vistas: 210,
    descargas: 87,
    likes: 19,
    creadoEn: '2026-09-02T15:10:00.000Z',
  },
  {
    id: 'doc-003',
    repoId: 'repo-001',
    titulo: 'Parcial 2 resuelto — listas enlazadas',
    descripcion: 'Solución del parcial con la justificación de cada método implementado.',
    tipo: 'resumen',
    corte: 2,
    tema: 'Listas enlazadas',
    etiquetas: ['parcial', 'repaso'],
    archivo: {
      nombre: 'parcial-2-listas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 289_440,
      url: PDF_MUESTRA,
    },
    autorUsername: 'sergioaguerrero',
    vistas: 342,
    descargas: 156,
    likes: 28,
    creadoEn: '2026-09-24T18:00:00.000Z',
  },

  // ── repo-002 · Bases de Datos I ─────────────────────────────────────────
  {
    id: 'doc-004',
    repoId: 'repo-002',
    titulo: 'Modelo entidad-relación del sistema de biblioteca',
    descripcion:
      'Diagrama completo con entidades, atributos, relaciones y cardinalidades del caso de estudio.',
    tipo: 'proyecto',
    corte: 1,
    tema: 'Modelado E-R',
    etiquetas: ['laboratorio', 'repaso'],
    archivo: {
      nombre: 'modelo-er-biblioteca.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 734_912,
      url: PDF_MUESTRA,
    },
    autorUsername: 'lauramartinez',
    vistas: 189,
    descargas: 64,
    likes: 21,
    creadoEn: '2026-08-16T11:00:00.000Z',
  },
  {
    id: 'doc-005',
    repoId: 'repo-002',
    titulo: 'Normalización hasta tercera forma normal',
    descripcion:
      'Ejemplos de 1FN, 2FN y 3FN sobre la misma tabla, con el paso a paso de cada descomposición.',
    tipo: 'guia',
    corte: 2,
    tema: 'Normalización',
    etiquetas: ['sql', 'taller', 'formulas'],
    archivo: {
      nombre: 'normalizacion-3fn.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 402_180,
      url: PDF_MUESTRA,
    },
    autorUsername: 'lauramartinez',
    vistas: 275,
    descargas: 118,
    likes: 33,
    creadoEn: '2026-09-05T16:25:00.000Z',
  },
  {
    id: 'doc-006',
    repoId: 'repo-002',
    titulo: 'Consultas SQL del parcial (JOIN, GROUP BY, subconsultas)',
    descripcion: 'Las 10 consultas del parcial resueltas y explicadas línea por línea.',
    tipo: 'resumen',
    corte: 3,
    tema: 'Consultas SQL',
    etiquetas: ['sql', 'parcial', 'ejercicios'],
    archivo: {
      nombre: 'consultas-sql-parcial.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 265_701,
      url: PDF_MUESTRA,
    },
    autorUsername: 'lauramartinez',
    vistas: 431,
    descargas: 207,
    likes: 45,
    creadoEn: '2026-10-20T16:40:00.000Z',
  },

  // ── repo-003 · Cálculo Integral ─────────────────────────────────────────
  {
    id: 'doc-007',
    repoId: 'repo-003',
    titulo: 'Guía de integración por partes',
    descripcion: 'Teoría breve, los casos típicos y 20 ejercicios con respuesta.',
    tipo: 'guia',
    corte: 1,
    tema: 'Integración por partes',
    etiquetas: ['formulas', 'ejercicios', 'repaso'],
    archivo: {
      nombre: 'guia-integracion-partes.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 318_220,
      url: PDF_MUESTRA,
    },
    autorUsername: 'andrespineda',
    vistas: 96,
    descargas: 38,
    likes: 6,
    creadoEn: '2026-08-21T08:45:00.000Z',
  },
  {
    id: 'doc-008',
    repoId: 'repo-003',
    titulo: 'Taller de integrales impropias',
    descripcion: 'Convergencia, divergencia y comparación directa con ejercicios tipo parcial.',
    tipo: 'guia',
    corte: 3,
    tema: 'Integrales impropias',
    etiquetas: ['taller', 'final'],
    archivo: {
      nombre: 'taller-impropias.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 297_540,
      url: PDF_MUESTRA,
    },
    autorUsername: 'andrespineda',
    vistas: 74,
    descargas: 22,
    likes: 4,
    creadoEn: '2026-10-11T11:15:00.000Z',
  },

  // ── repo-004 · Programación I ───────────────────────────────────────────
  {
    id: 'doc-009',
    repoId: 'repo-004',
    titulo: 'Ejercicios de condicionales en Java',
    descripcion: '20 ejercicios con if/else y switch, solución y salida esperada.',
    tipo: 'guia',
    corte: 1,
    tema: 'Condicionales',
    etiquetas: ['ejercicios', 'poo'],
    archivo: {
      nombre: 'ejercicios-condicionales.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 210_944,
      url: PDF_MUESTRA,
    },
    autorUsername: 'camilodaza',
    vistas: 512,
    descargas: 231,
    likes: 56,
    creadoEn: '2026-08-06T19:20:00.000Z',
  },
  {
    id: 'doc-010',
    repoId: 'repo-004',
    titulo: 'Presentación: introducción a los ciclos',
    descripcion: 'Diapositivas de clase sobre for, while y do-while con ejemplos.',
    tipo: 'apunte',
    corte: 2,
    tema: 'Ciclos',
    etiquetas: ['apunte', 'repaso'],
    archivo: {
      nombre: 'ciclos-introduccion.pptx',
      extension: 'pptx',
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      tamanoBytes: 1_204_224,
      url: '/docs/ciclos-introduccion.pptx',
    },
    autorUsername: 'camilodaza',
    vistas: 340,
    descargas: 98,
    likes: 27,
    creadoEn: '2026-09-14T07:55:00.000Z',
  },

  // ── repo-005 · Estructuras de Datos ─────────────────────────────────────
  {
    id: 'doc-011',
    repoId: 'repo-005',
    titulo: 'Implementación de pilas y colas en C++',
    descripcion: 'Código completo de pila y cola con arreglos y con listas enlazadas.',
    tipo: 'proyecto',
    corte: 1,
    tema: 'Pilas y colas',
    etiquetas: ['laboratorio', 'algoritmos', 'poo'],
    archivo: {
      nombre: 'pilas-y-colas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 486_310,
      url: PDF_MUESTRA,
    },
    autorUsername: 'valentinarojas',
    vistas: 164,
    descargas: 72,
    likes: 15,
    creadoEn: '2026-08-23T13:50:00.000Z',
  },
  {
    id: 'doc-012',
    repoId: 'repo-005',
    titulo: 'Recorridos de árboles binarios (inorden, preorden, postorden)',
    descripcion: 'Explicación gráfica de los tres recorridos y su implementación recursiva.',
    tipo: 'apunte',
    corte: 3,
    tema: 'Árboles binarios',
    etiquetas: ['algoritmos', 'repaso'],
    archivo: {
      nombre: 'recorridos-arboles.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 377_128,
      url: PDF_MUESTRA,
    },
    autorUsername: 'valentinarojas',
    vistas: 223,
    descargas: 91,
    likes: 24,
    creadoEn: '2026-10-19T18:30:00.000Z',
  },

  // ── repo-006 · Redes ────────────────────────────────────────────────────
  {
    id: 'doc-013',
    repoId: 'repo-006',
    titulo: 'Laboratorio de subnetting con Packet Tracer',
    descripcion: 'Topología, tabla de direccionamiento y comandos usados en el laboratorio.',
    tipo: 'proyecto',
    corte: 1,
    tema: 'Subnetting',
    etiquetas: ['laboratorio', 'ejercicios'],
    archivo: {
      nombre: 'lab-subnetting.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 623_400,
      url: PDF_MUESTRA,
    },
    autorUsername: 'valentinarojas',
    vistas: 118,
    descargas: 44,
    likes: 9,
    creadoEn: '2026-08-29T15:30:00.000Z',
  },

  // ── repo-007 · Ingeniería de Software I ─────────────────────────────────
  {
    id: 'doc-014',
    repoId: 'repo-007',
    titulo: 'Plantilla de historias de usuario',
    descripcion: 'Formato acordado en clase para redactar historias y criterios de aceptación.',
    tipo: 'guia',
    corte: 1,
    tema: 'Historias de usuario',
    etiquetas: ['taller', 'repaso'],
    archivo: {
      nombre: 'plantilla-historias.docx',
      extension: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      tamanoBytes: 88_320,
      url: '/docs/plantilla-historias.docx',
    },
    autorUsername: 'danielaospino',
    vistas: 97,
    descargas: 51,
    likes: 8,
    creadoEn: '2026-09-02T09:10:00.000Z',
  },
  {
    id: 'doc-015',
    repoId: 'repo-007',
    titulo: 'Diagramas UML del proyecto integrador',
    descripcion: 'Casos de uso, clases y secuencia del módulo de préstamos.',
    tipo: 'proyecto',
    corte: 2,
    tema: 'UML',
    etiquetas: ['laboratorio', 'repaso'],
    archivo: {
      nombre: 'uml-proyecto.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 812_004,
      url: PDF_MUESTRA,
    },
    autorUsername: 'danielaospino',
    vistas: 143,
    descargas: 37,
    likes: 11,
    creadoEn: '2026-10-16T10:25:00.000Z',
  },

  // ── repo-008 · Bases de Datos II ────────────────────────────────────────
  {
    id: 'doc-016',
    repoId: 'repo-008',
    titulo: 'Scripts de triggers y procedimientos en Oracle',
    descripcion: 'Scripts listos para ejecutar en SQL Developer, con comentarios de cada bloque.',
    tipo: 'proyecto',
    corte: 2,
    tema: 'PL/SQL',
    etiquetas: ['sql', 'laboratorio'],
    archivo: {
      nombre: 'scripts-plsql.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 549_220,
      url: PDF_MUESTRA,
    },
    autorUsername: 'lauramartinez',
    vistas: 205,
    descargas: 112,
    likes: 19,
    creadoEn: '2026-09-04T17:40:00.000Z',
  },
  {
    id: 'doc-017',
    repoId: 'repo-008',
    titulo: 'Hoja de cálculo de seguimiento de consultas',
    descripcion: 'Plantilla para registrar tiempos de ejecución de las consultas del taller.',
    tipo: 'guia',
    corte: 3,
    tema: 'Optimización',
    etiquetas: ['taller', 'formulas'],
    archivo: {
      nombre: 'seguimiento-consultas.xlsx',
      extension: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      tamanoBytes: 42_176,
      url: '/docs/seguimiento-consultas.xlsx',
    },
    autorUsername: 'lauramartinez',
    vistas: 66,
    descargas: 29,
    likes: 3,
    creadoEn: '2026-10-21T20:10:00.000Z',
  },

  // ── repo-009 · Inteligencia Artificial ──────────────────────────────────
  {
    id: 'doc-018',
    repoId: 'repo-009',
    titulo: 'Búsqueda A* explicada con un ejemplo',
    descripcion: 'Heurísticas admisibles, costo acumulado y desarrollo paso a paso del algoritmo.',
    tipo: 'apunte',
    corte: 1,
    tema: 'Búsqueda A*',
    etiquetas: ['algoritmos', 'repaso'],
    archivo: {
      nombre: 'busqueda-a-estrella.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 401_560,
      url: PDF_MUESTRA,
    },
    autorUsername: 'sergioaguerrero',
    vistas: 132,
    descargas: 47,
    likes: 13,
    creadoEn: '2026-09-11T11:50:00.000Z',
  },

  // ── repo-010 · Cálculo Diferencial ──────────────────────────────────────
  {
    id: 'doc-019',
    repoId: 'repo-010',
    titulo: 'Taller de límites con respuesta',
    descripcion: 'Límites laterales, al infinito y por definición. Incluye respuestas.',
    tipo: 'guia',
    corte: 1,
    tema: 'Límites',
    etiquetas: ['taller', 'ejercicios'],
    archivo: {
      nombre: 'taller-limites.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 255_880,
      url: PDF_MUESTRA,
    },
    autorUsername: 'camilodaza',
    vistas: 88,
    descargas: 33,
    likes: 5,
    creadoEn: '2026-09-13T08:20:00.000Z',
  },
  {
    id: 'doc-020',
    repoId: 'repo-010',
    titulo: 'Formulario de derivadas',
    descripcion: 'Reglas de derivación en una sola página, listo para imprimir.',
    tipo: 'resumen',
    corte: 2,
    tema: 'Derivadas',
    etiquetas: ['formulas', 'repaso', 'quiz'],
    archivo: {
      nombre: 'formulario-derivadas.pdf',
      extension: 'pdf',
      mime: 'application/pdf',
      tamanoBytes: 164_320,
      url: PDF_MUESTRA,
    },
    autorUsername: 'camilodaza',
    vistas: 176,
    descargas: 94,
    likes: 17,
    creadoEn: '2026-10-09T09:45:00.000Z',
  },
];
