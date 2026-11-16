/**
 * @file catalogs.js
 * @description Closed lists used by the forms and the dialogs.
 * They come from the API contract (BE-15 and BE-27), so they live apart.
 */

/** Material types that can be published in a repository. */
export const MATERIAL_TYPES = [
  { value: 'apunte', label: 'Apunte' },
  { value: 'guia', label: 'Guía' },
  { value: 'resumen', label: 'Resumen' },
  { value: 'proyecto', label: 'Proyecto' },
];

/** Terms of the semester a document belongs to. */
export const TERMS = [
  { value: 1, label: 'Corte 1' },
  { value: 2, label: 'Corte 2' },
  { value: 3, label: 'Corte 3' },
];

/** Suggested tags for the document upload Autocomplete. */
export const SUGGESTED_TAGS = [
  'parcial',
  'taller',
  'quiz',
  'ejercicios',
  'laboratorio',
  'final',
  'repaso',
  'formulas',
  'algoritmos',
  'sql',
  'grafos',
  'poo',
];

/** Report reasons available in view 1 of moderation (FE-23). */
export const REPORT_REASONS = [
  { value: 'mal-etiquetado', label: 'Mal etiquetado' },
  { value: 'duplicado', label: 'Contenido duplicado' },
  { value: 'inapropiado', label: 'Contenido inapropiado' },
  { value: 'examen-vigente', label: 'Examen vigente' },
  { value: 'plagio', label: 'Plagio' },
];

/** Curated topic suggestions grouped by subject id (`subjects.js`). */
export const SUGGESTED_TOPICS_BY_SUBJECT = {
  1: [
    'Variables y tipos de datos',
    'Estructuras condicionales',
    'Estructuras repetitivas',
    'Funciones y procedimientos',
    'Arreglos unidimensionales',
    'Pseudocódigo y diagramas de flujo',
  ],
  2: [
    'Funciones y dominio',
    'Límites',
    'Continuidad',
    'Derivadas',
    'Reglas de derivación',
    'Aplicaciones de la derivada',
  ],
  7: [
    'Proposiciones lógicas',
    'Tablas de verdad',
    'Reglas de inferencia',
    'Cuantificadores',
    'Teoría de conjuntos',
    'Demostraciones',
  ],
  9: [
    'Matrices y determinantes',
    'Sistemas de ecuaciones lineales',
    'Vectores en R2 y R3',
    'Espacios vectoriales',
    'Transformaciones lineales',
    'Valores y vectores propios',
  ],
  10: [
    'Antiderivadas',
    'Integración por sustitución',
    'Integración por partes',
    'Fracciones parciales',
    'Integrales impropias',
    'Áreas y volúmenes',
  ],
  14: [
    'Variables y operadores',
    'Condicionales',
    'Ciclos',
    'Métodos y funciones',
    'Arreglos básicos',
    'Introducción a POO',
  ],
  17: [
    'Funciones de varias variables',
    'Derivadas parciales',
    'Gradiente y derivadas direccionales',
    'Extremos y multiplicadores de Lagrange',
    'Integrales múltiples',
    'Cálculo vectorial',
  ],
  19: [
    'Medidas de tendencia central',
    'Probabilidad básica',
    'Distribuciones de probabilidad',
    'Muestreo e intervalos de confianza',
    'Pruebas de hipótesis',
    'Regresión lineal',
  ],
  20: [
    'Listas enlazadas',
    'Pilas y colas',
    'Recursividad',
    'Árboles binarios',
    'Árboles AVL',
    'Grafos',
    'Tablas hash',
  ],
  21: [
    'Arreglos y matrices',
    'Recursividad',
    'Listas enlazadas',
    'POO: herencia y polimorfismo',
    'Manejo de excepciones',
    'Archivos y flujos',
  ],
  25: [
    'Modelado E-R',
    'Modelo relacional',
    'Normalización',
    'Consultas SQL',
    'Álgebra relacional',
    'Índices y vistas',
  ],
  26: [
    'Ecuaciones de primer orden',
    'Variables separables',
    'Ecuaciones lineales de orden superior',
    'Transformada de Laplace',
    'Sistemas de ecuaciones diferenciales',
  ],
  28: [
    'Programación lineal',
    'Método simplex',
    'Dualidad y sensibilidad',
    'Problemas de transporte',
    'Teoría de redes y PERT/CPM',
  ],
  30: [
    'Patrones de diseño',
    'Programación orientada a eventos',
    'Interfaces gráficas',
    'Concurrencia e hilos',
    'Conexión a bases de datos',
  ],
  32: [
    'Errores y precisión numérica',
    'Raíces de ecuaciones',
    'Interpolación polinomial',
    'Integración numérica',
    'Sistemas lineales numéricos',
  ],
  33: [
    'Sistemas numéricos y lógica digital',
    'Compuertas y circuitos combinacionales',
    'Arquitectura Von Neumann',
    'Memoria y caché',
    'Lenguaje ensamblador',
  ],
  34: [
    'PL/SQL',
    'Triggers y procedimientos almacenados',
    'Optimización',
    'Transacciones y concurrencia',
    'Bases de datos NoSQL',
  ],
  36: [
    'Ciclo de vida del software',
    'Ingeniería de requisitos',
    'Historias de usuario',
    'UML',
    'Metodologías ágiles',
  ],
  37: [
    'HTML5 y CSS3',
    'JavaScript y DOM',
    'APIs REST',
    'Frontend con React',
    'Autenticación y seguridad web',
  ],
  39: [
    'Arquitectura de software',
    'Patrones de diseño',
    'Pruebas unitarias y de integración',
    'Calidad de software',
    'Control de versiones',
  ],
  43: [
    'Ciclo de vida móvil',
    'Diseño de interfaces móviles',
    'Consumo de APIs',
    'Almacenamiento local',
    'Notificaciones y permisos',
  ],
  44: [
    'Gestión de procesos e hilos',
    'Planificación de CPU',
    'Sincronización y concurrencia',
    'Gestión de memoria',
    'Sistemas de archivos',
  ],
  48: [
    'Agentes inteligentes',
    'Búsqueda no informada',
    'Búsqueda A*',
    'Lógica difusa',
    'Aprendizaje automático',
    'Redes neuronales',
  ],
  49: [
    'Modelo OSI y TCP/IP',
    'Subnetting',
    'Enrutamiento estático y dinámico',
    'VLAN y switching',
    'Protocolos de aplicación',
  ],
  58: [
    'Criptografía',
    'Seguridad en redes',
    'Vulnerabilidades OWASP',
    'Control de acceso',
    'Auditoría y normativas ISO 27001',
  ],
};

/** System roles. */
export const ROLES = {
  STUDENT: 'estudiante',
  ADMIN: 'admin',
};
