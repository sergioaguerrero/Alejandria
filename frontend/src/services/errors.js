/**
 * @file errors.js
 * @description Normalized error of the services layer.
 *
 * Screens never receive a raw error from Axios or from a mock:
 * they always receive an ApiError with a message ready to show in an Alert.
 */

/** Business or network error with a message in Spanish. */
export class ApiError extends Error {
  /**
   * @param {string} message  Text ready to show to the user.
   * @param {object} [options]
   * @param {number} [options.status=0]  HTTP code (0 if there was no connection).
   * @param {Record<string, string>|null} [options.fields=null]  Errors per form field.
   * @param {string|null} [options.code=null]  Machine-readable error code.
   * @param {Record<string, unknown>|null} [options.meta=null]  Extra metadata from the API.
   * @param {unknown} [options.cause=null]  Original error, for debugging.
   */
  constructor(message, { status = 0, fields = null, code = null, meta = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.code = code;
    this.meta = meta;
    this.cause = cause;
  }
}

/**
 * Generic message according to the HTTP code, for when the backend
 * does not send its own message.
 * @param {number} status
 * @returns {string}
 */
function messageByStatus(status) {
  switch (status) {
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
    case 429:
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    case 500:
      return 'Ocurrió un error en el servidor. Intenta de nuevo.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

/**
 * Converts any error (Axios, mock or JavaScript) into an ApiError.
 * @param {unknown} error
 * @returns {ApiError}
 */
export function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const response = /** @type {{ response?: any, request?: any, message?: string }} */ (error)
    ?.response;

  if (response) {
    const data = response.data ?? {};
    return new ApiError(
      data.message ?? messageByStatus(response.status),
      {
        status: response.status,
        fields: data.fields ?? null,
        code: data.code ?? null,
        meta: data.meta ?? null,
        cause: error,
      },
    );
  }

  if (/** @type {{ request?: any }} */ (error)?.request) {
    return new ApiError(
      'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
      { status: 0, cause: error },
    );
  }

  const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
  return new ApiError(message, { cause: error });
}
