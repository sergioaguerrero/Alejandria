package com.backend.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private String code;
    private Map<String, String> fields;
    private Map<String, Object> meta;
    private LocalDateTime timestamp;

    public ErrorResponse(int status, String error, String message) {
        this(status, error, message, null, null, null);
    }

    public ErrorResponse(
            int status,
            String error,
            String message,
            String code,
            Map<String, String> fields,
            Map<String, Object> meta
    ) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.code = code;
        this.fields = fields;
        this.meta = meta;
        this.timestamp = LocalDateTime.now();
    }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Map<String, String> getFields() { return fields; }
    public void setFields(Map<String, String> fields) { this.fields = fields; }

    public Map<String, Object> getMeta() { return meta; }
    public void setMeta(Map<String, Object> meta) { this.meta = meta; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
