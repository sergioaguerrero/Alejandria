package com.backend.service;

import com.backend.config.VerificationProperties;
import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.Role;
import com.backend.domain.identity.User;
import com.backend.dto.ApiMessageResponse;
import com.backend.exception.AuthException;
import com.backend.repository.EmailVerificationCodeRepository;
import com.backend.repository.RoleRepository;
import com.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@SpringBootTest
class EmailVerificationServiceTest {

    @Autowired
    private EmailVerificationCodeRepository codeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private VerificationProperties properties;

    private EmailService emailService;
    private AtomicReference<Instant> currentInstant;
    private EmailVerificationService verificationService;
    private User testUser;

    @BeforeEach
    void setUp() {
        codeRepository.deleteAll();
        userRepository.deleteAll();

        emailService = mock(EmailService.class);
        currentInstant = new AtomicReference<>(Instant.parse("2026-11-15T15:00:00Z"));
        Clock mutableClock = new Clock() {
            @Override
            public ZoneId getZone() {
                return ZoneId.of("UTC");
            }

            @Override
            public Clock withZone(ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return currentInstant.get();
            }
        };

        verificationService = new EmailVerificationService(
                codeRepository,
                userRepository,
                emailService,
                properties,
                mutableClock
        );

        Role role = roleRepository.findByName("ESTUDIANTE")
                .orElseGet(() -> roleRepository.save(new Role("ESTUDIANTE", Set.of("READ"))));

        User user = new User(
                "jdoe",
                "Juan",
                null,
                "Perez",
                "Lopez",
                "jperez@unicesar.edu.co",
                "hashed-password",
                false,
                LocalDateTime.now(mutableClock)
        );
        user.setRole(role);
        testUser = userRepository.save(user);
    }

    @Test
    void issueVerificationCodeStoresHashAndRejectsExpiredCode() {
        verificationService.issueVerificationCode(testUser, false);

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCodeEmail(
                eq("jperez@unicesar.edu.co"),
                eq("Juan"),
                codeCaptor.capture(),
                eq(15)
        );
        String issuedCode = codeCaptor.getValue();
        assertThat(issuedCode).matches("\\d{6}");

        EmailVerificationCode stored = codeRepository
                .findTopByUserAndUsedFalseOrderByCreatedAtDesc(testUser)
                .orElseThrow();
        assertThat(stored.getCodeHash()).doesNotContain(issuedCode);

        // Avanza el reloj 16 minutos para expirar el código
        currentInstant.set(currentInstant.get().plusSeconds(16 * 60));

        assertThatThrownBy(() -> verificationService.verifyCode("jperez@unicesar.edu.co", issuedCode))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> {
                    AuthException authEx = (AuthException) ex;
                    assertThat(authEx.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(authEx.getCode()).isEqualTo("CODE_EXPIRED");
                });
    }

    @Test
    void resendRespectsCooldownAndInvalidatesPreviousCode() {
        verificationService.issueVerificationCode(testUser, false);

        ArgumentCaptor<String> firstCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationCodeEmail(
                eq("jperez@unicesar.edu.co"),
                eq("Juan"),
                firstCaptor.capture(),
                anyInt()
        );
        String firstCode = firstCaptor.getValue();

        // Reenvío inmediato falla por cooldown
        currentInstant.set(currentInstant.get().plusSeconds(20));
        assertThatThrownBy(() -> verificationService.resendCode("jperez@unicesar.edu.co"))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> {
                    AuthException authEx = (AuthException) ex;
                    assertThat(authEx.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
                    assertThat(authEx.getCode()).isEqualTo("RESEND_COOLDOWN");
                });

        // Después de 60s permite reenviar e invalida el código anterior
        currentInstant.set(currentInstant.get().plusSeconds(45));
        ApiMessageResponse resendResponse = verificationService.resendCode("jperez@unicesar.edu.co");
        assertThat(resendResponse.isSuccess()).isTrue();

        assertThatThrownBy(() -> verificationService.verifyCode("jperez@unicesar.edu.co", firstCode))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> assertThat(((AuthException) ex).getCode()).isEqualTo("CODE_INVALID"));
    }
}
