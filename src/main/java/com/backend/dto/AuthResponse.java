package com.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String token;
    private UserDto user;
    private boolean requiresVerification;
    private String message;
    private Long resendCooldownSeconds;

    public AuthResponse() {}

    public AuthResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
        this.requiresVerification = false;
    }

    public static AuthResponse pendingVerification(UserDto user, String message, long resendCooldownSeconds) {
        AuthResponse response = new AuthResponse();
        response.setUser(user);
        response.setRequiresVerification(true);
        response.setMessage(message);
        response.setResendCooldownSeconds(resendCooldownSeconds);
        return response;
    }

    public static AuthResponse authenticated(String token, UserDto user, String message) {
        AuthResponse response = new AuthResponse(token, user);
        response.setMessage(message);
        return response;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public boolean isRequiresVerification() { return requiresVerification; }
    public void setRequiresVerification(boolean requiresVerification) { this.requiresVerification = requiresVerification; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getResendCooldownSeconds() { return resendCooldownSeconds; }
    public void setResendCooldownSeconds(Long resendCooldownSeconds) { this.resendCooldownSeconds = resendCooldownSeconds; }
}
