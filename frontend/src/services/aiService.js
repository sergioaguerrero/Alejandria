/**
 * @file aiService.js
 * @description AI study questionnaire generation and management (FE-20, FE-21, FE-22, BE-35, BE-36).
 */

import { USE_MOCK, waitForMock } from './config.js';
import { ApiError } from './errors.js';
import http from './http.js';
import { store } from '../mocks/store.js';
import { currentUser } from './authService.js';
import { emitMockNotification } from './notificationService.js';

function isMutualFriend(usernameA, usernameB) {
  if (!usernameA || !usernameB || !store.userFollows) return false;
  return (
    store.userFollows.has(`${usernameA}::${usernameB}`) &&
    store.userFollows.has(`${usernameB}::${usernameA}`)
  );
}

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
function enrichMaterialAccess(item, user, notFoundMsg, forbiddenMsg) {
  if (!item) {
    throw new ApiError(notFoundMsg, { status: 404 });
  }
  const share = (store.aiShares || []).find(
    (s) => s.materialId === item.id && s.recipientUsername === user.username,
  );
  if (item.userId !== user.id && !share) {
    throw new ApiError(forbiddenMsg, { status: 403 });
  }
  const copy = JSON.parse(JSON.stringify(item));
  if (share && item.userId !== user.id) {
    copy.isSharedWithMe = true;
    copy.sharedBy = share.senderUsername;
    copy.shareNote = share.note || '';
    copy.sharedAt = share.createdAt;
  }
  return copy;
}

function buildStructuredAiMaterial({ contentType, repository, scope, scopeValue, scopeLabel, user }) {
  const repoDocs = (store.documents || []).filter((doc) => doc.repositoryId === repository.id);
  const scopedDocs = repoDocs.filter((doc) => {
    if (scope === 'term' && scopeValue) return Number(doc.term) === Number(scopeValue);
    if (scope === 'topic' && scopeValue) {
      return (doc.topic || '').toLowerCase().includes(String(scopeValue).toLowerCase());
    }
    if (scope === 'tag' && scopeValue) {
      return (doc.tags || []).some((t) => t.toLowerCase().includes(String(scopeValue).toLowerCase()));
    }
    return true;
  });
  const baseDocs = scopedDocs.length > 0 ? scopedDocs : repoDocs;
  const primaryTopic = scope === 'topic' && scopeValue
    ? scopeValue
    : baseDocs[0]?.topic || repository.subject?.name || repository.name;
  const docRefs = baseDocs.slice(0, 3).map((d) => d.title);
  const docsLabel = docRefs.length > 0 ? docRefs.join(', ') : repository.name;

  store.counters.aiMaterial = (store.counters.aiMaterial || 0) + 1;
  const id = `mat-${Date.now()}-${store.counters.aiMaterial}`;
  const baseMeta = {
    id,
    contentType,
    repositoryId: repository.id,
    repositoryName: repository.name,
    subjectName: repository.subject?.name ?? 'Materia',
    scope,
    scopeValue,
    scopeLabel,
    userId: user.id,
    savedInMyStudy: false,
    createdAt: new Date().toISOString(),
  };

  if (contentType === 'summary') {
    return {
      ...baseMeta,
      title: `Resumen IA: ${repository.name}`,
      estimatedReadMinutes: 5,
      overview: `Síntesis académica generada para ${scopeLabel.toLowerCase()} de "${repository.name}", enfocada en ${primaryTopic} a partir de: ${docsLabel}.`,
      sections: [
        {
          heading: `1. Fundamentos de ${primaryTopic}`,
          body: `Recopilación estructurada de los conceptos teóricos esenciales cubiertos en los apuntes de ${repository.subject?.name ?? 'la materia'}.`,
          keyPoints: [
            `Definición formal, alcance y supuestos clave trabajados en ${docsLabel}.`,
            'Relación directa entre los principios del tema y los problemas tipo parcial.',
            'Criterios recomendados para validar soluciones bajo restricciones reales.',
          ],
        },
        {
          heading: '2. Aplicaciones y Patrones Frecuentes',
          body: 'Síntesis de procedimientos prácticos y decisiones de diseño detectadas en los talleres y guías del repositorio.',
          keyPoints: [
            'Comparación entre enfoques alternativos según eficiencia y mantenibilidad.',
            'Errores comunes al implementar casos borde y cómo prevenirlos.',
          ],
        },
        {
          heading: '3. Puntos Clave para Evaluación',
          body: 'Resumen de fórmulas, invariantes y criterios evaluados con mayor frecuencia.',
          keyPoints: [
            'Verifica siempre precondiciones de entrada antes de aplicar un algoritmo o regla.',
            'Justifica cada paso intermedio conectándolo con la teoría estudiada.',
          ],
        },
      ],
      keyConcepts: [
        {
          term: primaryTopic,
          definition: `Eje central del bloque analizado (${scopeLabel}), base para resolver ejercicios aplicados.`,
        },
        {
          term: 'Validación de casos borde',
          definition: 'Comprobación sistemática de entradas mínimas, vacías o límite para evitar fallos.',
        },
        {
          term: 'Criterio de eficiencia',
          definition: 'Evaluación del costo computacional o estructural respecto a alternativas equivalentes.',
        },
      ],
    };
  }

  if (contentType === 'guide') {
    return {
      ...baseMeta,
      title: `Guía de estudio IA: ${repository.name}`,
      introduction: `Plan guiado paso a paso para dominar ${primaryTopic} (${scopeLabel}), integrando el material de ${docsLabel}.`,
      objectives: [
        `Comprender los fundamentos conceptuales de ${primaryTopic} y su vocabulario técnico.`,
        'Resolver ejercicios paso a paso justificando cada decisión tomada.',
        'Detectar y corregir errores frecuentes antes de presentar el parcial o taller.',
      ],
      modules: [
        {
          title: `Módulo 1: Bases conceptuales de ${primaryTopic}`,
          summary: 'Lectura dirigida de definiciones, propiedades e invariantes clave del tema.',
          keyTakeaways: [
            'Identifica las variables, entidades o estructuras protagonistas del problema.',
            'Resume con tus propias palabras la regla principal antes de pasar a la práctica.',
          ],
          practicePrompt: `Explica con un ejemplo breve cómo se aplica ${primaryTopic} en uno de los escenarios de "${repository.name}".`,
        },
        {
          title: 'Módulo 2: Resolución guiada de problemas',
          summary: 'Estrategia metódica para abordar ejercicios de complejidad media y alta.',
          keyTakeaways: [
            'Divide el enunciado en subproblemas independientes y valida entradas límite.',
            'Documenta supuestos y verifica consistencia de resultados paso a paso.',
          ],
          practicePrompt:
            'Toma un taller del repositorio, resuélvelo sin mirar la solución y compara cada paso crítico.',
        },
        {
          title: 'Módulo 3: Autoevaluación tipo parcial',
          summary: 'Simulacro breve bajo límite de tiempo para consolidar retención.',
          keyTakeaways: [
            'Prioriza precisión conceptual y claridad en las justificaciones.',
            'Refuerza con un cuestionario IA cualquier tema donde dudes más de 2 minutos.',
          ],
          practicePrompt: 'Formula 2 preguntas conceptuales que podrían aparecer en el examen y respóndelas.',
        },
      ],
      checklist: [
        `Repasé los conceptos centrales de ${primaryTopic}.`,
        'Practiqué al menos dos ejercicios completos de los documentos base.',
        'Verifiqué los errores frecuentes y casos borde del módulo.',
      ],
    };
  }

  return {
    ...baseMeta,
    title: `Diapositivas IA: ${repository.name}`,
    subtitle: `Presentación estructurada sobre ${primaryTopic} • ${scopeLabel}`,
    slides: [
      {
        slideNumber: 1,
        title: repository.name,
        subtitle: `${repository.subject?.name ?? 'Materia'} — ${scopeLabel}`,
        bulletPoints: [
          `Tema central: ${primaryTopic}.`,
          `Fuentes base del repositorio: ${docsLabel}.`,
          'Material de apoyo visual estructurado para estudio y exposición.',
        ],
        takeaway: 'Visión panorámica clara del contenido antes de profundizar.',
        speakerNotes: 'Presenta el alcance de la sesión y qué objetivos debe dominar el grupo al finalizar.',
      },
      {
        slideNumber: 2,
        title: `Conceptos esenciales de ${primaryTopic}`,
        subtitle: 'Definiciones y principios base',
        bulletPoints: [
          'Definición formal del concepto principal y su propósito en la asignatura.',
          'Componentes clave y cómo interactúan entre sí.',
          'Restricciones e invariantes que nunca deben romperse.',
        ],
        takeaway: 'Dominar el vocabulario base acelera la resolución de problemas complejos.',
        speakerNotes: 'Detente en la intuición del problema antes de mostrar notación formal.',
      },
      {
        slideNumber: 3,
        title: 'Flujo práctico y metodología',
        subtitle: 'Cómo abordar problemas paso a paso',
        bulletPoints: [
          'Analizar entradas, salidas esperadas y restricciones de contexto.',
          'Seleccionar la estrategia o estructura más adecuada justificando el porqué.',
          'Validar casos límite y verificar complejidad o integridad.',
        ],
        takeaway: 'Un método ordenado evita errores por omisión bajo presión.',
        speakerNotes: 'Muestra un ejemplo corto aplicado paso a paso en pizarra o código.',
      },
      {
        slideNumber: 4,
        title: 'Errores comunes y buenas prácticas',
        subtitle: 'Lo que debes cuidar en evaluaciones y entregas',
        bulletPoints: [
          'Evitar asumir entradas limpias o estructuras vacías sin validación previa.',
          'No confundir síntomas con causas raíz al depurar o analizar modelos.',
          'Mantener trazabilidad entre el diseño teórico y la implementación final.',
        ],
        takeaway: 'Anticipar casos borde distingue una solución funcional de una robusta.',
        speakerNotes: 'Invita a identificar qué error han cometido antes en talleres similares.',
      },
      {
        slideNumber: 5,
        title: 'Síntesis y siguientes pasos',
        subtitle: 'Cierre y plan de repaso activo',
        bulletPoints: [
          `Conectar ${primaryTopic} con el resto de documentos del repositorio.`,
          'Complementar estas láminas con un cuestionario de autoevaluación IA.',
          'Guardar el material en "Mi estudio" o compartirlo con amigos del curso.',
        ],
        takeaway: 'Combina repaso visual con práctica activa para consolidar el aprendizaje.',
        speakerNotes: 'Cierra resumiendo los 3 conceptos indispensables para el parcial.',
      },
    ],
  };
}

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
export async function generateQuiz({ repositoryId, contentType = 'quiz', scope = 'all', scopeValue = null }) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para generar cuestionarios con IA.', { status: 401 });
  }

  if (!repositoryId) {
    throw new ApiError('Selecciona un repositorio para generar el cuestionario.', { status: 400 });
  }

  if (!USE_MOCK) {
    const endpoint = contentType === 'quiz' ? '/api/ai/quiz' : '/api/ai/materials';
    const { data } = await http.post(endpoint, {
      ...(contentType !== 'quiz' ? { contentType } : {}),
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

  if (contentType !== 'quiz') {
    const material = buildStructuredAiMaterial({
      contentType,
      repository,
      scope,
      scopeValue,
      scopeLabel,
      user,
    });
    store.aiMaterials = store.aiMaterials || [];
    store.aiMaterials.unshift(material);
    return JSON.parse(JSON.stringify(material));
  }

  const quiz = {
    contentType: 'quiz',
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

  const share = (store.aiShares || []).find(
    (s) => s.materialId === quiz.id && s.recipientUsername === user.username,
  );
  if (quiz.userId !== user.id && !share) {
    throw new ApiError('No tienes permiso para ver este cuestionario.', { status: 403 });
  }

  const copy = JSON.parse(JSON.stringify(quiz));
  if (share && quiz.userId !== user.id) {
    copy.isSharedWithMe = true;
    copy.sharedBy = share.senderUsername;
    copy.shareNote = share.note || '';
    copy.sharedAt = share.createdAt;
  }
  return copy;
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
  const list = [
    ...store.quizzes.map((q) => ({ ...q, contentType: q.contentType || 'quiz' })),
    ...(store.aiMaterials || []),
  ]
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

  const material = (store.aiMaterials || []).find((m) => m.id === id);
  if (material) {
    material.savedInMyStudy = false;
  }

  return { success: true };
}


/**
 * Lists usernames of friends with whom the current user already shared an AI material (FE-33).
 * @param {string} materialId
 * @returns {Promise<string[]>}
 */
export async function getSharedFriendsForMaterial(materialId) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para consultar compartidos.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get(`/api/ai/materials/${encodeURIComponent(materialId)}/shares`);
    return Array.isArray(data) ? data : (data?.sharedWith ?? []);
  }

  await waitForMock(100);

  return (store.aiShares || [])
    .filter((s) => s.materialId === materialId && s.senderUsername === user.username)
    .map((s) => s.recipientUsername);
}

/**
 * Shares an AI-generated material exclusively with mutual friends (FE-33, BE-38).
 * @param {string} materialId
 * @param {string[]} friendUsernames
 * @param {string} [note]
 * @returns {Promise<{ sharedCount: number, sharedWith: string[] }>}
 */
export async function shareAiContentWithFriends(materialId, friendUsernames, note = '') {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Debes iniciar sesión para compartir contenido con tus amigos.', { status: 401 });
  }

  const targets = Array.from(
    new Set((friendUsernames || []).map((u) => String(u).trim().toLowerCase()).filter(Boolean)),
  );
  if (targets.length === 0) {
    throw new ApiError('Selecciona al menos un amigo para compartir.', { status: 400 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(`/api/ai/materials/${encodeURIComponent(materialId)}/share`, {
      friendUsernames: targets,
      note: String(note || '').trim(),
    });
    return data;
  }

  await waitForMock(250);

  const material =
    store.quizzes.find((q) => q.id === materialId) ??
    (store.aiMaterials || []).find((m) => m.id === materialId);
  if (!material) {
    throw new ApiError('El contenido de IA no existe o fue eliminado.', { status: 404 });
  }
  if (material.userId !== user.id) {
    throw new ApiError('Solo puedes compartir contenido de IA generado por ti.', { status: 403 });
  }

  for (const friendUsername of targets) {
    if (!isMutualFriend(user.username, friendUsername)) {
      throw new ApiError(
        `@${friendUsername} no es tu amigo mutuo. Solo puedes compartir contenido de IA con amigos.`,
        { status: 403 },
      );
    }
  }

  store.aiShares = store.aiShares || [];
  const cleanNote = String(note || '').trim();
  const targetUrl =
    material.contentType && material.contentType !== 'quiz'
      ? `/ai/material/${material.id}`
      : `/ai/quiz/${material.id}`;

  for (const friendUsername of targets) {
    const existing = store.aiShares.find(
      (s) =>
        s.materialId === material.id &&
        s.senderUsername === user.username &&
        s.recipientUsername === friendUsername,
    );

    if (existing) {
      existing.note = cleanNote || existing.note;
      existing.createdAt = new Date().toISOString();
    } else {
      store.counters.aiShare = (store.counters.aiShare || 0) + 1;
      store.aiShares.unshift({
        id: `share-${String(store.counters.aiShare).padStart(3, '0')}`,
        materialId: material.id,
        senderUsername: user.username,
        recipientUsername: friendUsername,
        note: cleanNote,
        createdAt: new Date().toISOString(),
      });
    }

    emitMockNotification({
      recipientUsername: friendUsername,
      type: 'ai_shared',
      title: 'Contenido de IA compartido',
      message: `@${user.username} compartió contigo "${material.title}".`,
      targetUrl,
    });
  }

  return { sharedCount: targets.length, sharedWith: targets };
}

/**
 * Lists AI materials shared by mutual friends with the current user (FE-33, BE-38).
 * @returns {Promise<object[]>}
 */
/**
 * Generates an AI study material of any supported type (quiz, summary, guide, slides) (FE-34, BE-37).
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function generateAiMaterial(params) {
  return generateQuiz(params);
}

/**
 * Gets a non-quiz AI material (summary, study guide, slides) by id (FE-34, BE-37).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getAiMaterialById(id) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para acceder a este material.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get(`/api/ai/materials/${encodeURIComponent(id)}`);
    return data;
  }

  await waitForMock(150);
  const item =
    (store.aiMaterials || []).find((m) => m.id === id) ??
    store.quizzes.find((q) => q.id === id);
  return enrichMaterialAccess(
    item,
    user,
    'El material generado no existe o fue eliminado.',
    'No tienes permiso para ver este material de IA.',
  );
}

/**
 * Toggles or saves a generated AI material (summary, guide, slides, quiz) to "Mi estudio" (FE-34).
 * @param {string} id
 * @param {boolean} [save=true]
 * @returns {Promise<object>}
 */
export async function toggleSaveAiMaterialToMyStudy(id, save = true) {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para guardar contenidos.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.post(`/api/ai/materials/${encodeURIComponent(id)}/save`, { save });
    return data;
  }

  await waitForMock(150);
  const item =
    (store.aiMaterials || []).find((m) => m.id === id) ??
    store.quizzes.find((q) => q.id === id);
  if (!item) {
    throw new ApiError('Material no encontrado.', { status: 404 });
  }

  item.savedInMyStudy = Boolean(save);
  return JSON.parse(JSON.stringify(item));
}

export async function getSharedWithMeAiMaterials() {
  const user = currentUser();
  if (!user) {
    throw new ApiError('Inicia sesión para ver el contenido compartido contigo.', { status: 401 });
  }

  if (!USE_MOCK) {
    const { data } = await http.get('/api/ai/shared-with-me');
    return Array.isArray(data) ? data : (data?.items ?? []);
  }

  await waitForMock(200);

  const allMaterials = [...(store.quizzes || []), ...(store.aiMaterials || [])];
  const shared = (store.aiShares || [])
    .filter((s) => s.recipientUsername === user.username)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const results = [];
  for (const share of shared) {
    const mat = allMaterials.find((item) => item.id === share.materialId);
    if (!mat) continue;
    results.push({
      ...JSON.parse(JSON.stringify(mat)),
      sharedBy: share.senderUsername,
      shareNote: share.note || '',
      sharedAt: share.createdAt,
      isSharedWithMe: true,
    });
  }

  return results;
}
