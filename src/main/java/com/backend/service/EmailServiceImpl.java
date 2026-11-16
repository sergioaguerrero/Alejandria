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
        String provider = mailProperties.getProvider() == null
                ? "console"
                : mailProperties.getProvider().trim().toLowerCase();

        String safeName = (recipientName == null || recipientName.isBlank()) ? "estudiante" : recipientName.trim();
        String subject = "Código de verificación — Alejandría";
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
        log.info("Correo OTP enviado vía SMTP a {}", toEmail);
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

        log.info("Correo OTP enviado vía Resend API a {}", toEmail);
    }

    private String buildPlainText(String recipientName, String code, int expirationMinutes) {
        return """
                Hola %s,

                Tu código para completar el registro en Alejandría es: %s

                Este código vence en %d minutos.
                Si no solicitaste este registro, puedes ignorar este mensaje.
                """.formatted(recipientName, code, expirationMinutes);
    }

    private String buildHtmlBody(String recipientName, String code, int expirationMinutes) {
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
}
