package com.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Reglas y parámetros de seguridad para códigos OTP de verificación de correo.
 */
@ConfigurationProperties(prefix = "app.verification")
public class VerificationProperties {

    private int codeLength = 6;
    private int expirationMinutes = 15;
    private int maxAttempts = 5;
    private long resendCooldownSeconds = 60;
    private String hashSecret = "alejandria-dev-verification-secret-change-in-prod";
    private int unverifiedCleanupHours = 48;

    public int getCodeLength() {
        return codeLength;
    }

    public void setCodeLength(int codeLength) {
        this.codeLength = codeLength;
    }

    public int getExpirationMinutes() {
        return expirationMinutes;
    }

    public void setExpirationMinutes(int expirationMinutes) {
        this.expirationMinutes = expirationMinutes;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public long getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    public void setResendCooldownSeconds(long resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public String getHashSecret() {
        return hashSecret;
    }

    public void setHashSecret(String hashSecret) {
        this.hashSecret = hashSecret;
    }

    public int getUnverifiedCleanupHours() {
        return unverifiedCleanupHours;
    }

    public void setUnverifiedCleanupHours(int unverifiedCleanupHours) {
        this.unverifiedCleanupHours = unverifiedCleanupHours;
    }
}
