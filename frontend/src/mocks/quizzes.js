/**
 * @file quizzes.js
 * @description Seed AI-generated quizzes and question banks (FE-20, FE-21, BE-35, BE-36).
 */

/**
 * @typedef {object} QuizQuestion
 * @property {number} id
 * @property {string} question
 * @property {string[]} options
 * @property {number} correctIndex
 * @property {string} explanation
 */

/**
 * @typedef {object} Quiz
 * @property {string} id
 * @property {string} title
 * @property {string} repositoryId
 * @property {string} repositoryName
 * @property {string} subjectName
 * @property {'all'|'term'|'topic'|'tag'} scope
 * @property {string|number|null} scopeValue
 * @property {string} userId
 * @property {QuizQuestion[]} questions
 * @property {boolean} savedInMyStudy
 * @property {number|null} lastScore
 * @property {string} createdAt
 */

/** @type {Quiz[]} */
export const QUIZZES = [
  {
    id: 'quiz-001',
    title: 'Cuestionario de Estructuras de Datos y Algoritmos',
    repositoryId: 'repo-001',
    repositoryName: 'Estructuras de Datos y Algoritmos',
    subjectName: 'Estructuras de Datos',
    scope: 'term',
    scopeValue: 1,
    userId: 'usr-001',
    savedInMyStudy: true,
    lastScore: 80,
    createdAt: '2026-10-27T10:00:00.000Z',
    questions: [
      {
        id: 1,
        question: '¿Cuál es la complejidad temporal en el peor caso para buscar un elemento en un árbol binario de búsqueda (ABB) no balanceado?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctIndex: 2,
        explanation: 'En el peor caso, un ABB degenera en una lista enlazada (árbol degenerado o desbalanceado), requiriendo tiempo lineal O(n).',
      },
      {
        id: 2,
        question: '¿Qué propiedad fundamental distingue a un árbol AVL de un árbol binario de búsqueda regular?',
        options: [
          'Cada nodo tiene como máximo un solo hijo.',
          'La diferencia de altura entre los subárboles izquierdo y derecho de cualquier nodo no supera 1.',
          'Solo almacena números enteros positivos.',
          'Los nodos están ordenados de mayor a menor en recorrido in-order.',
        ],
        correctIndex: 1,
        explanation: 'El factor de equilibrio en un árbol AVL debe pertenecer al conjunto {-1, 0, 1} en todo nodo, garantizando balance de altura.',
      },
      {
        id: 3,
        question: 'En la implementación de una cola de prioridad mediante un montículo binario (Binary Heap), ¿cuál es el costo de extraer el elemento mínimo?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctIndex: 1,
        explanation: 'Localizar la raíz toma O(1), pero la reestructuración del montículo (heapify hacia abajo) toma O(log n).',
      },
      {
        id: 4,
        question: '¿Cuál de los siguientes algoritmos de grafos permite hallar los caminos más cortos desde un origen único en presencia de pesos no negativos?',
        options: ['Dijkstra', 'Floyd-Warshall', 'Kruskal', 'Prim'],
        correctIndex: 0,
        explanation: 'El algoritmo de Dijkstra calcula la distancia mínima desde un vértice fuente a todos los demás cuando las aristas tienen pesos no negativos.',
      },
      {
        id: 5,
        question: '¿Qué estructura de datos es la base recomendada para implementar un recorrido por amplitud (BFS) en un grafo?',
        options: ['Pila (Stack)', 'Cola FIFO (Queue)', 'Árbol B', 'Tabla Hash sin colisiones'],
        correctIndex: 1,
        explanation: 'El recorrido BFS explora nivel por nivel, por lo que requiere una cola FIFO para procesar los vértices en orden de llegada.',
      },
    ],
  },
];
