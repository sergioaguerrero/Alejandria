package com.backend.service;

public interface EmailService {

    /**
     * Envía de forma asíncrona el código OTP de confirmación de correo al estudiante.
     */
    void sendVerificationCodeEmail(String toEmail, String recipientName, String code, int expirationMinutes);

    /**
     * Envía de forma asíncrona el enlace temporal para restablecer la contraseña.
     */
    void sendPasswordResetEmail(String toEmail, String recipientName, String resetLink, int expirationMinutes);
}
