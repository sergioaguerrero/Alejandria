/**
 * @file aiMaterials.js
 * @description Seed mock AI-generated summaries, study guides, and presentation slides (FE-34, BE-37).
 */

export const AI_MATERIALS = [
  {
    id: 'mat-001',
    contentType: 'summary',
    title: 'Resumen IA: Complejidad, Árboles AVL y Grafos',
    repositoryId: 'repository-001',
    repositoryName: 'Banco Estructuras de Datos — Corte 1 y 2',
    subjectName: 'Estructuras de Datos',
    scope: 'all',
    scopeValue: null,
    scopeLabel: 'Todo el repositorio',
    userId: 'usr-001',
    savedInMyStudy: true,
    estimatedReadMinutes: 6,
    createdAt: '2026-10-27T11:30:00.000Z',
    overview:
      'Síntesis ejecutiva basada en los apuntes del repositorio sobre análisis asintótico Big-O, auto-balanceo de árboles binarios de búsqueda (AVL) y recorridos fundamentales en grafos dirigidos y no dirigidos.',
    sections: [
      {
        heading: '1. Análisis Asintótico y Notación Big-O',
        body: 'Permite estimar el crecimiento del tiempo y memoria de un algoritmo independientemente del hardware cuando el tamaño de entrada n crece.',
        keyPoints: [
          'O(1) acceso directo por índice; O(log n) división sucesiva como búsqueda binaria.',
          'O(n log n) caracteriza algoritmos eficientes de ordenamiento como Merge Sort y Quick Sort promedio.',
          'Evaluar siempre el peor caso cuando se diseñan servicios con restricciones de latencia.',
        ],
      },
      {
        heading: '2. Árboles Binarios Balanceados (AVL)',
        body: 'Un árbol AVL garantiza que la diferencia de altura entre subárbol izquierdo y derecho (factor de balance) permanezca entre -1 y +1 tras cada inserción o eliminación.',
        keyPoints: [
          'Rotación simple derecha o izquierda corrige desbalances lineales (LL o RR).',
          'Rotaciones dobles LR o RL resuelven desbalances en zigzag.',
          'Garantiza búsqueda, inserción y borrado en tiempo O(log n) en el peor caso.',
        ],
      },
      {
        heading: '3. Grafos, BFS y DFS',
        body: 'Modelan redes mediante vértices y aristas, representables con listas de adyacencia O(V + E) o matriz de adyacencia O(V²).',
        keyPoints: [
          'BFS usa cola (FIFO) y halla el camino más corto en número de aristas.',
          'DFS usa pila o recursión; es base para ordenamiento topológico y detección de ciclos.',
        ],
      },
    ],
    keyConcepts: [
      {
        term: 'Factor de balance',
        definition: 'Diferencia entre la altura del subárbol izquierdo y derecho en un nodo AVL.',
      },
      {
        term: 'Lista de adyacencia',
        definition: 'Estructura ideal para grafos dispersos, almacena solo conexiones existentes.',
      },
      {
        term: 'Invariante estructural',
        definition: 'Propiedad que todo método mutador debe preservar antes y después de ejecutarse.',
      },
    ],
  },
  {
    id: 'mat-002',
    contentType: 'slides',
    title: 'Diapositivas IA: Normalización y Diseño Relacional SQL',
    repositoryId: 'repository-002',
    repositoryName: 'Bases de Datos Relacionales — Talleres SQL',
    subjectName: 'Bases de Datos',
    scope: 'topic',
    scopeValue: 'Normalización 3FN',
    scopeLabel: 'Tema: Normalización 3FN',
    userId: 'usr-002',
    savedInMyStudy: true,
    subtitle: 'Guía visual de dependencias funcionales y formas normales 1FN a BCNF',
    createdAt: '2026-10-28T15:15:00.000Z',
    slides: [
      {
        slideNumber: 1,
        title: '¿Por qué normalizar un esquema relacional?',
        subtitle: 'Objetivo central del diseño lógico',
        bulletPoints: [
          'Eliminar redundancia innecesaria entre filas de una misma tabla.',
          'Evitar anomalías de inserción, actualización y borrado.',
          'Proteger la integridad referencial desde la estructura física.',
        ],
        takeaway: 'Una base normalizada almacena cada hecho una sola vez.',
        speakerNotes: 'Inicia explicando un ejemplo real de tabla con datos repetidos de cursos y docentes.',
      },
      {
        slideNumber: 2,
        title: 'Primera y Segunda Forma Normal (1FN y 2FN)',
        subtitle: 'Atomicidad y dependencia funcional total',
        bulletPoints: [
          '1FN: cada atributo contiene un único valor atómico, sin listas ni grupos repetitivos.',
          '2FN: aplica a tablas en 1FN con clave primaria compuesta.',
          'Ningún atributo no clave puede depender solo de una parte de la clave primaria.',
        ],
        takeaway: 'Si existe dependencia parcial, extrae esos atributos a su propia tabla.',
        speakerNotes: 'Resalta el caso típico de la tabla DetallePedido(pedido_id, producto_id, nombre_producto).',
      },
      {
        slideNumber: 3,
        title: 'Tercera Forma Normal (3FN)',
        subtitle: 'Eliminando dependencias transitivas',
        bulletPoints: [
          'Requiere cumplir 2FN previamente.',
          'Los atributos no clave deben depender únicamente de la clave primaria.',
          'Si A → B y B → C (siendo B no clave), separa B → C en otra relación.',
        ],
        takeaway: 'Toda columna no clave depende de la clave, toda la clave y nada más que la clave.',
        speakerNotes: 'Conecta este principio con consultas JOIN limpias y mantenibles.',
      },
      {
        slideNumber: 4,
        title: 'Buenas prácticas en SQL de producción',
        subtitle: 'Del diseño teórico a índices reales',
        bulletPoints: [
          'Define claves foráneas explícitas con políticas ON DELETE coherentes.',
          'Crea índices en columnas usadas frecuentemente en JOIN y WHERE.',
          'Documenta restricciones CHECK y UNIQUE directamente en el DDL.',
        ],
        takeaway: 'Buen modelado + índices adecuados = consultas predecibles bajo carga.',
        speakerNotes: 'Cierra resumiendo cuándo desnormalizar de forma controlada solo en vistas analíticas.',
      },
    ],
  },
];
