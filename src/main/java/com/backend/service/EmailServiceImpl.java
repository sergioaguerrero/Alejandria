package com.backend.service;

import com.backend.config.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.HtmlUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Implementación del envío de correo transaccional.
 * Permite alternar entre consola local ({@code console}), SMTP ({@code smtp}) y Resend API ({@code resend}).
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final MailProperties mailProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RestClient restClient;

    public EmailServiceImpl(MailProperties mailProperties, ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailProperties = mailProperties;
        this.mailSenderProvider = mailSenderProvider;
        this.restClient = RestClient.create();
    }

    @Override
    @Async
    public void sendVerificationCodeEmail(String toEmail, String recipientName, String code, int expirationMinutes) {
        String provider = mailProperties.getProvider() == null
                ? "console"
                : mailProperties.getProvider().trim().toLowerCase();

        String safeName = (recipientName == null || recipientName.isBlank()) ? "estudiante" : recipientName.trim();
        String subject = "Tu código de confirmación — Alejandría UPC";
        String plainText = buildPlainText(safeName, code, expirationMinutes);
        String htmlBody = buildHtmlBody(safeName, code, expirationMinutes);

        try {
            switch (provider) {
                case "smtp" -> sendViaSmtp(toEmail, subject, plainText, htmlBody);
                case "resend" -> sendViaResend(toEmail, subject, plainText, htmlBody);
                case "console" -> log.info(
                        "[DEV-MAIL] Código de verificación para {} ({}): {} (expira en {} min)",
                        toEmail,
                        safeName,
                        code,
                        expirationMinutes
                );
                default -> log.warn(
                        "Proveedor de correo desconocido '{}'. Usa 'console', 'smtp' o 'resend'. Código para {}: {}",
                        provider,
                        toEmail,
                        code
                );
            }
        } catch (Exception ex) {
            log.error("Error enviando el código de verificación a {} mediante proveedor '{}': {}",
                    toEmail, provider, ex.getMessage(), ex);
        }
    }

    private void sendViaSmtp(String toEmail, String subject, String plainText, String htmlBody)
            throws MessagingException {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException(
                    "JavaMailSender no está configurado. Verifica spring.mail.host, username y password."
            );
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
        helper.setFrom(mailProperties.getFrom());
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(plainText, htmlBody);
        mailSender.send(message);
        log.info("Correo OTP enviado vía SMTP a {}", toEmail);
    }

    private void sendViaResend(String toEmail, String subject, String plainText, String htmlBody) {
        String apiKey = mailProperties.getResendApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Falta app.mail.resend-api-key para enviar correos con Resend.");
        }

        Map<String, Object> payload = Map.of(
                "from", mailProperties.getFrom(),
                "to", List.of(toEmail),
                "subject", subject,
                "text", plainText,
                "html", htmlBody
        );

        restClient.post()
                .uri(mailProperties.getResendUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        log.info("Correo OTP enviado vía Resend API a {}", toEmail);
    }

    private String buildPlainText(String recipientName, String code, int expirationMinutes) {
        return """
                Hola %s,

                Usa este código para confirmar tu correo institucional en Alejandría UPC:

                %s

                Este código expira en %d minutos y admite un máximo de 5 intentos.
                Si no solicitaste este registro, puedes ignorar este mensaje.
                """.formatted(recipientName, code, expirationMinutes);
    }

    private String buildHtmlBody(String recipientName, String code, int expirationMinutes) {
        String escapedName = HtmlUtils.htmlEscape(recipientName);
        String escapedCode = HtmlUtils.htmlEscape(code);
        return """
                <!DOCTYPE html>
                <html lang="es">
                <body style="margin:0;padding:24px;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
                  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
                    <h2 style="margin:0 0 8px;color:#0f172a;">Alejandría — UPC</h2>
                    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Repositorio virtual académico</p>
                    <p style="margin:0 0 16px;font-size:15px;">Hola <strong>%s</strong>,</p>
                    <p style="margin:0 0 20px;font-size:15px;">
                      Ingresa el siguiente código de 6 dígitos para confirmar tu correo institucional y activar tu cuenta:
                    </p>
                    <div style="margin:24px 0;padding:18px;text-align:center;background:#f8fafc;border:1px dashed #94a3b8;border-radius:10px;">
                      <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;">%s</span>
                    </div>
                    <p style="margin:0 0 12px;font-size:13px;color:#475569;">
                      Este código expira en <strong>%d minutos</strong>. Por seguridad, no lo compartas con nadie.
                    </p>
                    <p style="margin:0;font-size:12px;color:#64748b;">
                      Si no solicitaste crear una cuenta en Alejandría, puedes ignorar este correo.
                    </p>
                  </div>
                </body>
                </html>
                """.formatted(escapedName, escapedCode, expirationMinutes);
    }
}
