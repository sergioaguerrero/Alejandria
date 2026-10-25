/**
 * @file index.js
 * @description Punto de entrada de los datos de ejemplo (FE-02).
 *
 * Importa desde aquí para no depender de las rutas internas:
 *   import { REPOS, MATERIAS } from '../mocks';
 */

export { MATERIAS } from './materias.js';
export { USUARIOS } from './usuarios.js';
export { REPOS } from './repos.js';
export { DOCUMENTOS } from './documentos.js';
export {
  TIPOS_MATERIAL,
  CORTES,
  ETIQUETAS_SUGERIDAS,
  MOTIVOS_REPORTE,
  ROLES,
} from './catalogos.js';
export { store, restablecerStore, siguienteId } from './store.js';
