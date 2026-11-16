package com.backend.service;

import com.backend.config.MailProperties;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class EmailServiceImplTest {

    @Test
    void sendsHtmlAndTextOtpViaSmtpAndDerivesGmailFromAddress() throws Exception {
        MailProperties props = new MailProperties();
        props.setProvider("smtp");
        // Mantiene el valor por defecto para verificar que toma spring.mail.username automáticamente

        List<MimeMessage> sentMessages = new ArrayList<>();
        JavaMailSenderImpl recordingMailSender = new JavaMailSenderImpl() {
            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage(Session.getInstance(new Properties()));
            }

            @Override
            public void send(MimeMessage mimeMessage) {
                sentMessages.add(mimeMessage);
            }
        };
        recordingMailSender.setHost("smtp.gmail.com");
        recordingMailSender.setUsername("alejandria.test@gmail.com");
        recordingMailSender.setPassword("abcd efgh ijkl mnop");

        EmailServiceImpl emailService = new EmailServiceImpl(props, providerOf(recordingMailSender));
        emailService.sendVerificationCodeEmail("estudiante@unicesar.edu.co", "Sergio", "482913", 15);

        assertThat(recordingMailSender.getPassword()).isEqualTo("abcdefghijklmnop");
        assertThat(sentMessages).hasSize(1);
        MimeMessage sent = sentMessages.get(0);
        assertThat(sent.getSubject()).contains("verificación");
        assertThat(sent.getFrom()[0].toString()).contains("alejandria.test@gmail.com");
        assertThat(sent.getAllRecipients()[0].toString()).isEqualTo("estudiante@unicesar.edu.co");
        assertThat(sent.getContent()).isInstanceOf(Multipart.class);
        assertThat(((Multipart) sent.getContent()).getContentType()).contains("multipart/alternative");
    }

    @Test
    void consoleProviderLogsWithoutRequiringMailSender() {
        MailProperties props = new MailProperties();
        props.setProvider("console");

        EmailServiceImpl emailService = new EmailServiceImpl(props, providerOf(null));
        assertThatCode(() ->
                emailService.sendVerificationCodeEmail("estudiante@unicesar.edu.co", "Laura", "123456", 15)
        ).doesNotThrowAnyException();
    }

    private ObjectProvider<JavaMailSender> providerOf(JavaMailSender sender) {
        return new ObjectProvider<>() {
            @Override
            public JavaMailSender getObject(Object... args) throws BeansException {
                return sender;
            }

            @Override
            public JavaMailSender getIfAvailable() throws BeansException {
                return sender;
            }

            @Override
            public JavaMailSender getIfUnique() throws BeansException {
                return sender;
            }

            @Override
            public JavaMailSender getObject() throws BeansException {
                return sender;
            }
        };
    }
}
