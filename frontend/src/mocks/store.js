/**
 * @file store.js
 * @description Estado en memoria de los datos de ejemplo.
 *
 * Los mocks originales son constantes; aquí se clonan una sola vez al
 * arrancar para que las acciones de la demo (me gusta, crear repo, subir
 * documento) se reflejen en pantalla aunque se recargue el módulo.
 *
 * Al recargar la página el estado vuelve a los datos iniciales: es un mock.
 */

import { DOCUMENTOS } from './documentos.js';
import { MATERIAS } from './materias.js';
import { REPOS } from './repos.js';
import { USUARIOS } from './usuarios.js';

/** Clona en profundidad datos planos (objetos, arreglos, primitivos). */
const clonar = (valor) => JSON.parse(JSON.stringify(valor));

/**
 * Contadores para generar ids nuevos con el mismo formato de los mocks.
 * @returns {{ usuarios: object[], repos: object[], documentos: object[], materias: object[], likesRepos: Set<string>, likesDocumentos: Set<string>, consecutivos: { repo: number, documento: number, usuario: number } }}
 */
function crearEstadoInicial() {
  return {
    usuarios: clonar(USUARIOS),
    repos: clonar(REPOS),
    documentos: clonar(DOCUMENTOS),
    materias: clonar(MATERIAS),
    /** Claves con formato `repoId::username`. */
    likesRepos: new Set(),
    /** Claves con formato `documentoId::username`. */
    likesDocumentos: new Set(),
    /** Ids de las materias marcadas por el usuario (FE-06). */
    materiasDeInteres: /** @type {number[]} */ ([]),
    consecutivos: {
      repo: REPOS.length,
      documento: DOCUMENTOS.length,
      usuario: USUARIOS.length,
    },
  };
}

/** Estado mutable que comparten todos los servicios en modo mock. */
export const store = crearEstadoInicial();

/** Devuelve el estado a los datos originales. */
export function restablecerStore() {
  Object.assign(store, crearEstadoInicial());
}

/**
 * Genera el siguiente id de una entidad, por ejemplo `repo-011`.
 * @param {'repo'|'documento'|'usuario'} entidad
 * @returns {string}
 */
export function siguienteId(entidad) {
  store.consecutivos[entidad] += 1;
  const numero = String(store.consecutivos[entidad]).padStart(3, '0');
  return `${entidad}-${numero}`;
}
