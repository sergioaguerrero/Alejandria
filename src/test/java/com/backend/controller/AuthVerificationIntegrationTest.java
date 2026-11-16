package com.backend.controller;

import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.User;
import com.backend.repository.EmailVerificationCodeRepository;
import com.backend.repository.UserRepository;
import com.backend.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthVerificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationCodeRepository codeRepository;

    @MockitoBean
    private EmailService emailService;

    @BeforeEach
    void cleanDatabase() {
        codeRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void fullRegistrationVerificationAndLoginFlow() throws Exception {
        String registerPayload = objectMapper.writeValueAsString(Map.of(
                "first_name", "Sergio",
                "second_name", "Andres",
                "first_lastname", "Guerrero",
                "second_lastname", "Daza",
                "username", "sergiotest",
                "email", "sergiotest@unicesar.edu.co",
                "password", "Alejandria1",
                "semester", 4
        ));

        // 1. Registro crea usuario no verificado y no devuelve JWT aún
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.requiresVerification").value(true))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andExpect(jsonPath("$.user.verified").value(false))
                .andExpect(jsonPath("$.user.email").value("sergiotest@unicesar.edu.co"));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).sendVerificationCodeEmail(
                eq("sergiotest@unicesar.edu.co"),
                eq("Sergio"),
                codeCaptor.capture(),
                eq(15)
        );
        String issuedCode = codeCaptor.getValue();

        // 2. Login bloqueado hasta verificar correo
        String loginPayload = objectMapper.writeValueAsString(Map.of(
                "identifier", "sergiotest@unicesar.edu.co",
                "password", "Alejandria1"
        ));
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"))
                .andExpect(jsonPath("$.meta.email").value("sergiotest@unicesar.edu.co"));

        // 3. Código inválido incrementa intentos sin revertir la transacción
        String wrongCode = issuedCode.equals("000000") ? "111111" : "000000";
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "sergiotest@unicesar.edu.co",
                                "code", wrongCode
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CODE_INVALID"));

        User pendingUser = userRepository.findByInstitutionalEmail("sergiotest@unicesar.edu.co").orElseThrow();
        EmailVerificationCode activeCode = codeRepository
                .findTopByUserAndUsedFalseOrderByCreatedAtDesc(pendingUser)
                .orElseThrow();
        assertThat(activeCode.getAttempts()).isEqualTo(1);

        // 4. Código correcto verifica al usuario y devuelve sesión activa
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "sergiotest@unicesar.edu.co",
                                "code", issuedCode
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requiresVerification").value(false))
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.verified").value(true));

        // 5. Login funciona normalmente tras verificar
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.verified").value(true));
    }

    @Test
    void fiveFailedAttemptsLockOutCodeAgainstBruteForce() throws Exception {
        String registerPayload = objectMapper.writeValueAsString(Map.of(
                "first_name", "Laura",
                "first_lastname", "Martinez",
                "second_lastname", "Rojas",
                "username", "lauralock",
                "email", "lauralock@unicesar.edu.co",
                "password", "Alejandria1"
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isCreated());

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCodeEmail(
                eq("lauralock@unicesar.edu.co"),
                eq("Laura"),
                codeCaptor.capture(),
                eq(15)
        );
        String realCode = codeCaptor.getValue();
        String wrongCode = realCode.equals("999999") ? "888888" : "999999";

        for (int i = 1; i <= 4; i++) {
            mockMvc.perform(post("/api/auth/verify-email")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "email", "lauralock@unicesar.edu.co",
                                    "code", wrongCode
                            ))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("CODE_INVALID"));
        }

        // Quinto intento fallido bloquea el código
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "lauralock@unicesar.edu.co",
                                "code", wrongCode
                        ))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"));

        // Incluso el código real queda invalidado después de 5 intentos
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "lauralock@unicesar.edu.co",
                                "code", realCode
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("CODE_EXPIRED"));
    }

    @Test
    void rejectsMassAssignmentOfVerifiedFlagAndDuplicateVerifiedEmail() throws Exception {
        String payloadWithVerifiedTrue = objectMapper.writeValueAsString(Map.of(
                "first_name", "Carlos",
                "first_lastname", "Daza",
                "second_lastname", "Pineda",
                "username", "carlosd",
                "email", "carlosd@unicesar.edu.co",
                "password", "Alejandria1",
                "verified", true
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithVerifiedTrue))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.verified").value(false))
                .andExpect(jsonPath("$.requiresVerification").value(true));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCodeEmail(
                eq("carlosd@unicesar.edu.co"),
                eq("Carlos"),
                codeCaptor.capture(),
                eq(15)
        );

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "carlosd@unicesar.edu.co",
                                "code", codeCaptor.getValue()
                        ))))
                .andExpect(status().isOk());

        // Re-registrar un correo ya verificado devuelve 409 Conflict
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithVerifiedTrue))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fields.email").exists());
    }
}
