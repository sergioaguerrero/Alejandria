package com.backend.dto;

public class ApiMessageResponse {
    private boolean success;
    private String message;
    private Long resendCooldownSeconds;

    public ApiMessageResponse() {}

    public ApiMessageResponse(boolean success, String message, Long resendCooldownSeconds) {
        this.success = success;
        this.message = message;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getResendCooldownSeconds() { return resendCooldownSeconds; }
    public void setResendCooldownSeconds(Long resendCooldownSeconds) { this.resendCooldownSeconds = resendCooldownSeconds; }
}
