package com.backend.service;

import com.backend.config.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
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
    private static final String DEFAULT_LOCAL_FROM_SUFFIX = "@alejandria.local>";

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
        String safeName = sanitizeRecipientName(recipientName);
        String subject = "Código de verificación — Alejandría";
        String plainText = buildVerificationPlainText(safeName, code, expirationMinutes);
        String htmlBody = buildVerificationHtmlBody(safeName, code, expirationMinutes);
        String consoleSummary = "[DEV-MAIL] Código de verificación para %s (%s): %s (expira en %d min)"
                .formatted(toEmail, safeName, code, expirationMinutes);

        deliverEmail(toEmail, subject, plainText, htmlBody, consoleSummary);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetLink, int expirationMinutes) {
        String safeName = sanitizeRecipientName(recipientName);
        String subject = "Restablecer contraseña — Alejandría";
        String plainText = buildPasswordResetPlainText(safeName, resetLink, expirationMinutes);
        String htmlBody = buildPasswordResetHtmlBody(safeName, resetLink, expirationMinutes);
        String consoleSummary = "[DEV-MAIL] Enlace de recuperación para %s (%s): %s (expira en %d min)"
                .formatted(toEmail, safeName, resetLink, expirationMinutes);

        deliverEmail(toEmail, subject, plainText, htmlBody, consoleSummary);
    }

    private void deliverEmail(
            String toEmail,
            String subject,
            String plainText,
            String htmlBody,
            String consoleSummary
    ) {
        String provider = mailProperties.getProvider() == null
                ? "console"
                : mailProperties.getProvider().trim().toLowerCase();

        try {
            switch (provider) {
                case "smtp" -> sendViaSmtp(toEmail, subject, plainText, htmlBody);
                case "resend" -> sendViaResend(toEmail, subject, plainText, htmlBody);
                case "brevo" -> sendViaBrevo(toEmail, subject, plainText, htmlBody);
                case "console" -> log.info(consoleSummary);
                default -> log.warn(
                        "Proveedor de correo desconocido '{}'. Usa 'console', 'smtp', 'resend' o 'brevo'. {}",
                        provider,
                        consoleSummary
                );
            }
        } catch (Exception ex) {
            log.error("Error enviando correo '{}' a {} mediante proveedor '{}': {}",
                    subject, toEmail, provider, ex.getMessage(), ex);
        }
    }

    private String sanitizeRecipientName(String recipientName) {
        return (recipientName == null || recipientName.isBlank()) ? "estudiante" : recipientName.trim();
    }

    private void sendViaSmtp(String toEmail, String subject, String plainText, String htmlBody)
            throws MessagingException {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException(
                    "JavaMailSender no está configurado. Verifica spring.mail.host, username y password."
            );
        }

        String fromAddress = mailProperties.getFrom();
        if (mailSender instanceof JavaMailSenderImpl impl) {
            String smtpUser = impl.getUsername();
            String smtpPass = impl.getPassword();
            if (smtpUser == null || smtpUser.isBlank() || smtpPass == null || smtpPass.isBlank()) {
                throw new IllegalStateException(
                        "Falta configurar spring.mail.username y spring.mail.password (App Password de Gmail) en application-local.properties."
                );
            }
            String normalizedUser = smtpUser.trim();
            impl.setUsername(normalizedUser);
            if (isGmailHost(impl.getHost())) {
                impl.setPassword(smtpPass.replaceAll("\\s+", ""));
            }
            if (fromAddress == null || fromAddress.isBlank() || fromAddress.endsWith(DEFAULT_LOCAL_FROM_SUFFIX)) {
                fromAddress = "Alejandria <" + normalizedUser + ">";
            }
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
        helper.setFrom(fromAddress);
        helper.setTo(toEmail);
        helper.setSubject(subject);

        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText(plainText, StandardCharsets.UTF_8.name());

        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(htmlBody, "text/html; charset=UTF-8");

        MimeMultipart alternative = new MimeMultipart("alternative");
        alternative.addBodyPart(textPart);
        alternative.addBodyPart(htmlPart);
        message.setContent(alternative);
        message.saveChanges();

        mailSender.send(message);
        log.info("Correo '{}' enviado vía SMTP a {}", subject, toEmail);
    }

    private boolean isGmailHost(String host) {
        if (host == null) {
            return false;
        }
        String normalized = host.trim().toLowerCase();
        return normalized.equals("smtp.gmail.com") || normalized.equals("smtp.googlemail.com");
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

        log.info("Correo '{}' enviado vía Resend API a {}", subject, toEmail);
    }

    private void sendViaBrevo(String toEmail, String subject, String plainText, String htmlBody) {
        String apiKey = mailProperties.getBrevoApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Falta app.mail.brevo-api-key (BREVO_API_KEY) para enviar correos con Brevo.");
        }

        Map<String, String> sender = resolveBrevoSender();
        Map<String, Object> payload = Map.of(
                "sender", sender,
                "to", List.of(Map.of("email", toEmail)),
                "subject", subject,
                "textContent", plainText,
                "htmlContent", htmlBody
        );

        restClient.post()
                .uri(mailProperties.getBrevoUrl())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .header("api-key", apiKey.trim())
                .body(payload)
                .retrieve()
                .toBodilessEntity();

        log.info("Correo '{}' enviado vía Brevo API a {}", subject, toEmail);
    }

    private Map<String, String> resolveBrevoSender() {
        String rawFrom = mailProperties.getFrom();
        if (rawFrom == null || rawFrom.isBlank() || rawFrom.endsWith(DEFAULT_LOCAL_FROM_SUFFIX)) {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender instanceof JavaMailSenderImpl impl && impl.getUsername() != null && !impl.getUsername().isBlank()) {
                return Map.of("name", "Alejandría UPC", "email", impl.getUsername().trim());
            }
        }
        if (rawFrom != null && !rawFrom.isBlank()) {
            String trimmed = rawFrom.trim();
            int lt = trimmed.indexOf('<');
            int gt = trimmed.indexOf('>', lt + 1);
            if (lt >= 0 && gt > lt) {
                String name = trimmed.substring(0, lt).trim().replace("\"", "");
                String email = trimmed.substring(lt + 1, gt).trim();
                return Map.of("name", name.isEmpty() ? "Alejandría UPC" : name, "email", email);
            }
            return Map.of("name", "Alejandría UPC", "email", trimmed);
        }
        throw new IllegalStateException("Falta configurar APP_MAIL_FROM con el correo remitente verificado en Brevo.");
    }

    private String buildVerificationPlainText(String recipientName, String code, int expirationMinutes) {
        return """
                Hola %s,

                Tu código para completar el registro en Alejandría es: %s

                Este código vence en %d minutos.
                Si no solicitaste este registro, puedes ignorar este mensaje.
                """.formatted(recipientName, code, expirationMinutes);
    }

    private String buildVerificationHtmlBody(String recipientName, String code, int expirationMinutes) {
        String escapedName = HtmlUtils.htmlEscape(recipientName);
        String escapedCode = HtmlUtils.htmlEscape(code);
        return """
                <!DOCTYPE html>
                <html lang="es">
                <body>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.6;">
                    <p>Hola %s,</p>
                    <p>Tu código para completar el registro en Alejandría es:</p>
                    <p style="font-size:24px;font-weight:700;letter-spacing:4px;margin:16px 0;">%s</p>
                    <p>Este código vence en %d minutos.</p>
                    <p style="font-size:13px;color:#6b7280;">Si no solicitaste este registro, puedes ignorar este mensaje.</p>
                  </div>
                </body>
                </html>
                """.formatted(escapedName, escapedCode, expirationMinutes);
    }

    private String buildPasswordResetPlainText(String recipientName, String resetLink, int expirationMinutes) {
        return """
                Hola %s,

                Recibimos una solicitud para restablecer tu contraseña en Alejandría.
                Abre el siguiente enlace para crear una nueva contraseña:

                %s

                Este enlace vence en %d minutos.
                Si no solicitaste este cambio, puedes ignorar este mensaje.
                """.formatted(recipientName, resetLink, expirationMinutes);
    }

    private String buildPasswordResetHtmlBody(String recipientName, String resetLink, int expirationMinutes) {
        String escapedName = HtmlUtils.htmlEscape(recipientName);
        String escapedLink = HtmlUtils.htmlEscape(resetLink);
        return """
                <!DOCTYPE html>
                <html lang="es">
                <body>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.6;">
                    <p>Hola %s,</p>
                    <p>Recibimos una solicitud para restablecer tu contraseña en Alejandría.</p>
                    <p style="margin:20px 0;">
                      <a href="%s" style="background:#2563eb;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;">
                        Restablecer contraseña
                      </a>
                    </p>
                    <p style="font-size:13px;color:#4b5563;">Si el botón no funciona, copia este enlace:<br>%s</p>
                    <p>Este enlace vence en %d minutos.</p>
                    <p style="font-size:13px;color:#6b7280;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                  </div>
                </body>
                </html>
                """.formatted(escapedName, escapedLink, escapedLink, expirationMinutes);
    }
}
