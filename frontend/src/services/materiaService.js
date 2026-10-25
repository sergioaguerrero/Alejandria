/**
 * @file materiaService.js
 * @description Catálogo de materias (BE-03) y materias de interés (FE-06).
 */

import { USE_MOCK, esperarMock } from './config.js';
import http from './http.js';
import { store } from '../mocks/store.js';

/**
 * Obtiene el catálogo de materias, opcionalmente filtrado por semestre.
 * @param {{ semestre?: number|string|null }} [filtros]
 * @returns {Promise<object[]>}
 */
export async function obtenerMaterias({ semestre = null } = {}) {
  if (!USE_MOCK) {
    const { data } = await http.get('/materias', { params: { semestre } });
    return Array.isArray(data) ? data : data?.items ?? [];
  }

  await esperarMock();

  return store.materias
    .filter((materia) => !semestre || materia.semestre === Number(semestre))
    .sort((a, b) => a.semestre - b.semestre || a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Agrupa una lista de materias por semestre.
 * @param {object[]} materias
 * @returns {Array<{ semestre: number, materias: object[] }>}
 */
export function agruparPorSemestre(materias) {
  /** @type {Map<number, object[]>} */
  const grupos = new Map();

  for (const materia of materias) {
    if (!grupos.has(materia.semestre)) {
      grupos.set(materia.semestre, []);
    }
    grupos.get(materia.semestre)?.push(materia);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => a - b)
    .map(([semestre, lista]) => ({ semestre, materias: lista }));
}

/**
 * Obtiene las materias de interés del usuario de la sesión (FE-06).
 * @returns {Promise<number[]>} Ids de las materias seleccionadas.
 */
export async function obtenerMateriasDeInteres() {
  if (!USE_MOCK) {
    const { data } = await http.get('/usuarios/me/materias');
    return (Array.isArray(data) ? data : data?.items ?? []).map((materia) => materia.id);
  }

  await esperarMock(200);

  return [...store.materiasDeInteres];
}
