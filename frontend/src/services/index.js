/**
 * @file index.js
 * @description Punto de entrada de la capa de servicios (FE-02).
 *
 * Las pantallas importan desde aquí:
 *   import { obtenerRepos } from '../services';
 *
 * Así, si mañana se parte un servicio en varios archivos, las pantallas
 * no se enteran.
 */

export { USE_MOCK, API_URL } from './config.js';
export { ErrorApi, normalizarError } from './errores.js';
export { default as http } from './http.js';

export {
  login,
  registro,
  cerrarSesion,
  guardarSesion,
  obtenerSesionActual,
  usuarioActual,
} from './authService.js';

export {
  obtenerRepos,
  obtenerRepo,
  obtenerReposDeUsuario,
  crearRepo,
  actualizarRepo,
  eliminarRepo,
  alternarLikeRepo,
} from './repoService.js';

export {
  listarPorRepo,
  obtenerDocumento,
  subirDocumento,
  editarDocumento,
  eliminarDocumento,
  descargarDocumento,
  alternarLikeDocumento,
} from './documentoService.js';

export {
  obtenerMaterias,
  agruparPorSemestre,
  obtenerMateriasDeInteres,
} from './materiaService.js';
