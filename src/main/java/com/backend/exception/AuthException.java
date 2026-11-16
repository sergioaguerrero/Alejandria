package com.backend.exception;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

/**
 * Excepción de negocio para errores de autenticación y verificación de correo
 * con código HTTP, código de error semántico y errores por campo opcionales.
 */
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fields;
    private final Map<String, Object> meta;

    public AuthException(HttpStatus status, String code, String message) {
        this(status, code, message, null, null);
    }

    public AuthException(HttpStatus status, String code, String message, Map<String, String> fields) {
        this(status, code, message, fields, null);
    }

    public AuthException(
            HttpStatus status,
            String code,
            String message,
            Map<String, String> fields,
            Map<String, Object> meta
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.fields = fields == null ? null : Collections.unmodifiableMap(fields);
        this.meta = meta == null ? null : Collections.unmodifiableMap(meta);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Map<String, String> getFields() {
        return fields;
    }

    public Map<String, Object> getMeta() {
        return meta;
    }
}
