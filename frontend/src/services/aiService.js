/**
 * @file aiService.js
 * @description AI study questionnaire generation and management (FE-20, FE-21, FE-22, BE-35, BE-36).
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';

const DAILY_LIMIT = 5;

/** Question templates for realistic academic quiz generation in mock mode. */
const QUESTION_TEMPLATES = [
  {
    q: '¿Cuál es el propósito fundamental del concepto principal abordado en este material?',
    options: [
      'Optimizar el rendimiento y el uso eficiente de los recursos del sistema.',
      'Sustituir los paradigmas de programación tradicionales sin necesidad de compilación.',
      'Aumentar la complejidad algorítmica para asegurar mayor redundancia.',
      'Eliminar por completo la necesidad de validación de datos en tiempo de ejecución.',
    ],
    correctIndex: 0,
    explanation: 'El objetivo primordial radica en la optimización algorítmica y la correcta gestión de recursos de cómputo.',
  },
  {
    q: 'De acuerdo con las buenas prácticas de la disciplina, ¿cuál es la estructura o patrón recomendado?',
    options: [
      'Acoplamiento fuerte entre módulos para reducir llamadas a métodos.',
      'Diseño modular con alta cohesión y bajo acoplamiento.',
      'Almacenar todos los datos en variables globales para facilitar su acceso.',
      'Evitar el manejo de excepciones para acelerar la ejecución del hilo principal.',
    ],
    correctIndex: 1,
    explanation: 'La modularidad con alta cohesión y bajo acoplamiento garantiza mantenibilidad, reusabilidad y facilidad de pruebas.',
  },
  {
    q: 'En términos de complejidad computacional y análisis asintótico, ¿qué afirmación es correcta?',
    options: [
      'Una solución cuadrática O(n^2) siempre escala mejor que una logarítmica O(log n).',
      'El análisis en el peor caso proporciona una cota superior garantizada sobre el tiempo de ejecución.',
      'El uso de memoria adicional (espacio auxiliar) no influye en la eficiencia global.',
      'La notación Big-O mide el tiempo exacto en milisegundos en cualquier procesador.',
    ],
    correctIndex: 1,
    explanation: 'La notación Big-O describe el comportamiento asintótico superior, ofreciendo una garantía del peor escenario posible independientemente del hardware.',
  },
  {
    q: '¿Cuál de las siguientes afirmaciones describe con mayor precisión la relación entre los componentes estudiados?',
    options: [
      'Las abstracciones permiten aislar los detalles de implementación de la lógica de negocio.',
      'Las capas inferiores deben depender directamente de los módulos de presentación visual.',
      'No se deben aplicar índices ni particiones cuando el volumen de datos supera el gigabyte.',
      'El consumo síncrono bloqueante es la alternativa óptima para operaciones de entrada/salida intensivas.',
    ],
    correctIndex: 0,
    explanation: 'Las abstracciones e interfaces permiten desacoplar las reglas de negocio de las decisiones concretas de almacenamiento o infraestructura.',
  },
  {
    q: '¿Qué criterio es determinante al seleccionar esta técnica frente a otras alternativas?',
    options: [
      'La menor sobrecarga en tiempo de respuesta bajo alta concurrencia.',
      'El uso exclusivo de librerías propietarias y sin soporte de la comunidad.',
      'La imposibilidad de ejecutar pruebas unitarias automatizadas.',
      'La necesidad de reiniciar el servidor tras cada transacción completada.',
    ],
    correctIndex: 0,
    explanation: 'Se prioriza la técnica que minimice la sobrecarga y mantenga la estabilidad bajo condiciones de carga y concurrencia elevada.',
  },
];

/**
 * Gets the current daily quota of AI generations for the user.
 * @returns {Promise<{ total: number, used: number, remaining: number }>}
 */
export async function getDailyAiQuota() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para usar el generador de cuestionarios con IA.', {
      status: 401,
    });
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/api/ai/quota');
    return data;
  }

  await waitForMock(150);
  const used = store.aiGenerationsToday.get(user.id) || 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);

  return {
    total: DAILY_LIMIT,
    used,
    remaining,
  };
}

/**
 * Generates an AI questionnaire for a repository and specified scope (FE-20, BE-35).
 * @param {object} params
 * @param {string} params.repositoryId
 * @param {'all'|'term'|'topic'|'tag'} params.scope
 * @param {string|number|null} [params.scopeValue]
 * @returns {Promise<object>} Generated quiz
 */
export async function generateQuiz({ repositoryId, scope = 'all', scopeValue = null }) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para generar cuestionarios con IA.', { status: 401 });
  }

  if (!repositoryId) {
    throw new ApiError('Selecciona un repositorio para generar el cuestionario.', { status: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post('/api/ai/quiz', {
      repositoryId,
      scope,
      scopeValue,
    });
    return data;
  }

  // Quota check in mock mode
  const currentUsed = store.aiGenerationsToday.get(user.id) || 0;
  if (currentUsed >= DAILY_LIMIT) {
    throw new ApiError(
      `Has alcanzado el límite diario de ${DAILY_LIMIT} generaciones con IA. Vuelve mañana para generar más cuestionarios.`,
      { status: 429 },
    );
  }

  // Find repository and associated documents
  const repository = store.repositories.find((r) => r.id === repositoryId);
  if (!repository) {
    throw new ApiError('El repositorio seleccionado no existe o fue eliminado.', { status: 404 });
  }

  // Simulate realistic AI generation latency (2 seconds)
  await waitForMock(2000);

  // Consume 1 quota
  store.aiGenerationsToday.set(user.id, currentUsed + 1);

  // Generate quiz questions tailored to the repository
  const questions = QUESTION_TEMPLATES.map((tmpl, idx) => ({
    id: idx + 1,
    question: `${tmpl.q} (${repository.name})`,
    options: tmpl.options,
    correctIndex: tmpl.correctIndex,
    explanation: tmpl.explanation,
  }));

  let scopeLabel = 'Todo el repositorio';
  if (scope === 'term') scopeLabel = `Corte ${scopeValue}`;
  else if (scope === 'topic') scopeLabel = `Tema: ${scopeValue}`;
  else if (scope === 'tag') scopeLabel = `Etiqueta: ${scopeValue}`;

  const quiz = {
    id: `quiz-${Date.now()}`,
    title: `Cuestionario IA: ${repository.name}`,
    repositoryId: repository.id,
    repositoryName: repository.name,
    subjectName: repository.subject?.name ?? 'Materia',
    scope,
    scopeValue,
    scopeLabel,
    userId: user.id,
    questions,
    savedInMyStudy: false,
    lastScore: null,
    createdAt: new Date().toISOString(),
  };

  store.quizzes.unshift(quiz);
  return { ...quiz };
}

/**
 * Gets a quiz by id (FE-21, BE-36).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getQuizById(id) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para acceder a este cuestionario.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get(`/api/ai/quiz/${encodeURIComponent(id)}`);
    return data;
  }

  await waitForMock(150);
  const quiz = store.quizzes.find((q) => q.id === id);
  if (!quiz) {
    throw new ApiError('El cuestionario no existe o fue eliminado.', { status: 404 });
  }

  return JSON.parse(JSON.stringify(quiz));
}

/**
 * Records score and completed status on a quiz (FE-21, BE-36).
 * @param {string} id
 * @param {{ score: number, answers?: number[] }} data
 * @returns {Promise<object>}
 */
export async function submitQuizAnswers(id, { score }) {
  if (!USE_MOCK) {
    const { data } = await http.post(`/api/ai/quiz/${encodeURIComponent(id)}/submit`, { score });
    return data;
  }

  await waitForMock(150);
  const quiz = store.quizzes.find((q) => q.id === id);
  if (!quiz) {
    throw new ApiError('Cuestionario no encontrado.', { status: 404 });
  }

  quiz.lastScore = score;
  return { ...quiz };
}

/**
 * Toggles or saves a quiz to "Mi estudio" (FE-22, BE-36).
 * @param {string} id
 * @param {boolean} [save=true]
 * @returns {Promise<object>}
 */
export async function toggleSaveQuizToMyStudy(id, save = true) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para guardar contenidos.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(`/api/ai/quiz/${encodeURIComponent(id)}/save`, { save });
    return data;
  }

  await waitForMock(150);
  const quiz = store.quizzes.find((q) => q.id === id);
  if (!quiz) {
    throw new ApiError('Cuestionario no encontrado.', { status: 404 });
  }

  quiz.savedInMyStudy = Boolean(save);
  return { ...quiz };
}

/**
 * Lists the saved AI study materials of the current user (FE-22, BE-36).
 * @returns {Promise<object[]>}
 */
export async function getMyStudyMaterials() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para ver tu material de estudio guardado.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/api/ai/my-study');
    return data;
  }

  await waitForMock(200);
  const list = store.quizzes
    .filter((q) => q.userId === user.id && q.savedInMyStudy)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return JSON.parse(JSON.stringify(list));
}

/**
 * Removes an item from "Mi estudio" (FE-22).
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteFromMyStudy(id) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para realizar esta acción.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.delete(`/api/ai/my-study/${encodeURIComponent(id)}`);
    return data;
  }

  await waitForMock(150);
  const quiz = store.quizzes.find((q) => q.id === id);
  if (quiz) {
    quiz.savedInMyStudy = false;
  }

  return { success: true };
}
