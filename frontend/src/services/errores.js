/**
 * @file errores.js
 * @description Error normalizado de la capa de servicios.
 *
 * Las pantallas nunca reciben un error crudo de Axios ni de un mock:
 * siempre reciben un ErrorApi con un mensaje listo para mostrar en un Alert.
 */

/** Error de negocio o de red con mensaje en español. */
export class ErrorApi extends Error {
  /**
   * @param {string} mensaje  Texto listo para mostrar al usuario.
   * @param {object} [opciones]
   * @param {number} [opciones.estado=0]  Código HTTP (0 si no hubo conexión).
   * @param {Record<string, string>|null} [opciones.campos=null]  Errores por campo del formulario.
   * @param {unknown} [opciones.causa=null]  Error original, para depuración.
   */
  constructor(mensaje, { estado = 0, campos = null, causa = null } = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.campos = campos;
    this.causa = causa;
  }
}

/**
 * Mensaje genérico según el código HTTP, para cuando el backend
 * no envía un mensaje propio.
 * @param {number} estado
 * @returns {string}
 */
function mensajePorEstado(estado) {
  switch (estado) {
    case 400:
      return 'La solicitud tiene datos inválidos.';
    case 401:
      return 'Credenciales incorrectas.';
    case 403:
      return 'No tienes permiso para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    case 409:
      return 'Ya existe un registro con esos datos.';
    case 413:
      return 'El archivo es demasiado grande.';
    case 500:
      return 'Ocurrió un error en el servidor. Intenta de nuevo.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

/**
 * Convierte cualquier error (Axios, mock o JavaScript) en un ErrorApi.
 * @param {unknown} error
 * @returns {ErrorApi}
 */
export function normalizarError(error) {
  if (error instanceof ErrorApi) {
    return error;
  }

  const respuesta = /** @type {{ response?: any, request?: any, message?: string }} */ (error)
    ?.response;

  if (respuesta) {
    const datos = respuesta.data ?? {};
    return new ErrorApi(
      datos.mensaje ?? datos.message ?? mensajePorEstado(respuesta.status),
      { estado: respuesta.status, campos: datos.campos ?? null, causa: error },
    );
  }

  if (/** @type {{ request?: any }} */ (error)?.request) {
    return new ErrorApi(
      'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
      { estado: 0, causa: error },
    );
  }

  const mensaje = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  return new ErrorApi(mensaje, { causa: error });
}
