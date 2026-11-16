package com.backend.service;

import com.backend.config.VerificationProperties;
import com.backend.domain.identity.EmailVerificationCode;
import com.backend.domain.identity.User;
import com.backend.dto.ApiMessageResponse;
import com.backend.exception.AuthException;
import com.backend.repository.EmailVerificationCodeRepository;
import com.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Gestiona la emisión, validación, reenvío y limpieza de códigos OTP de verificación de correo.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Pattern SIX_DIGITS_PATTERN = Pattern.compile("^\\d{6}$");
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final EmailVerificationCodeRepository codeRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final VerificationProperties properties;
    private final Clock clock;

    @Autowired
    public EmailVerificationService(
            EmailVerificationCodeRepository codeRepository,
            UserRepository userRepository,
            EmailService emailService,
            VerificationProperties properties
    ) {
        this(codeRepository, userRepository, emailService, properties, Clock.systemDefaultZone());
    }

    EmailVerificationService(
            EmailVerificationCodeRepository codeRepository,
            UserRepository userRepository,
            EmailService emailService,
            VerificationProperties properties,
            Clock clock
    ) {
        this.codeRepository = codeRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.properties = properties;
        this.clock = clock;
    }

    /**
     * Genera y envía un nuevo código OTP.
     *
     * @param user usuario pendiente de verificar
     * @param preserveActiveCooldown si es true (reintento desde /register), respeta el cooldown activo
     *                               sin fallar devolviendo los segundos restantes; si es false (/resend-verification),
     *                               lanza HTTP 429 si aún está en cooldown.
     * @return segundos de cooldown restantes para el siguiente reenvío
     */
    @Transactional
    public long issueVerificationCode(User user, boolean preserveActiveCooldown) {
        LocalDateTime now = LocalDateTime.now(clock);
        long cooldownSeconds = properties.getResendCooldownSeconds();

        Optional<EmailVerificationCode> latestActive = codeRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(user);
        if (latestActive.isPresent()) {
            EmailVerificationCode current = latestActive.get();
            long elapsedSeconds = Math.max(0, Duration.between(current.getCreatedAt(), now).getSeconds());
            if (!current.isExpired(now) && elapsedSeconds < cooldownSeconds) {
                long remaining = cooldownSeconds - elapsedSeconds;
                if (preserveActiveCooldown) {
                    return remaining;
                }
                throw new AuthException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "RESEND_COOLDOWN",
                        "Debes esperar " + remaining + " segundos antes de solicitar otro código.",
                        null,
                        Map.of("retryAfterSeconds", remaining)
                );
            }
        }

        codeRepository.invalidateActiveCodesByUser(user);

        String plainCode = generateOtpCode();
        String codeHash = hashCode(user.getInstitutionalEmail(), plainCode);
        LocalDateTime expiresAt = now.plusMinutes(properties.getExpirationMinutes());

        EmailVerificationCode verificationCode = new EmailVerificationCode(user, codeHash, now, expiresAt);
        codeRepository.save(verificationCode);

        emailService.sendVerificationCodeEmail(
                user.getInstitutionalEmail(),
                user.getFirst_name(),
                plainCode,
                properties.getExpirationMinutes()
        );

        return cooldownSeconds;
    }

    /**
     * Verifica el código de 6 dígitos y marca la cuenta como verificada.
     * Se usa {@code noRollbackFor = AuthException.class} para que los intentos fallidos
     * y la invalidación por límite de intentos persistan en la base de datos.
     */
    @Transactional(noRollbackFor = AuthException.class)
    public User verifyCode(String rawEmail, String rawCode) {
        String email = normalizeEmail(rawEmail);
        String code = rawCode == null ? "" : rawCode.trim();

        if (!SIX_DIGITS_PATTERN.matcher(code).matches()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "CODE_INVALID",
                    "El código debe tener exactamente 6 dígitos numéricos.",
                    Map.of("code", "Ingresa los 6 dígitos del código.")
            );
        }

        User user = userRepository.findByInstitutionalEmail(email)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.BAD_REQUEST,
                        "CODE_INVALID",
                        "Código inválido o expirado."
                ));

        if (user.isVerified()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "ALREADY_VERIFIED",
                    "Tu correo ya fue confirmado. Ya puedes iniciar sesión."
            );
        }

        EmailVerificationCode activeCode = codeRepository.findTopByUserAndUsedFalseOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new AuthException(
                        HttpStatus.BAD_REQUEST,
                        "CODE_EXPIRED",
                        "El código ha expirado o ya fue utilizado. Solicita uno nuevo."
                ));

        LocalDateTime now = LocalDateTime.now(clock);
        if (activeCode.isExpired(now)) {
            activeCode.markUsed();
            codeRepository.save(activeCode);
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "CODE_EXPIRED",
                    "El código ha expirado. Solicita uno nuevo."
            );
        }

        int maxAttempts = properties.getMaxAttempts();
        if (activeCode.getAttempts() >= maxAttempts) {
            activeCode.markUsed();
            codeRepository.save(activeCode);
            throw new AuthException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "TOO_MANY_ATTEMPTS",
                    "Superaste el máximo de intentos permitidos. Solicita un nuevo código."
            );
        }

        String candidateHash = hashCode(email, code);
        boolean matches = MessageDigest.isEqual(
                candidateHash.getBytes(StandardCharsets.UTF_8),
                activeCode.getCodeHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            activeCode.incrementAttempts();
            int remainingAttempts = Math.max(0, maxAttempts - activeCode.getAttempts());
            if (remainingAttempts == 0) {
                activeCode.markUsed();
                codeRepository.save(activeCode);
                throw new AuthException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "TOO_MANY_ATTEMPTS",
                        "Código incorrecto. Alcanzaste el límite de intentos, solicita un código nuevo."
                );
            }

            codeRepository.save(activeCode);
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "CODE_INVALID",
                    "Código incorrecto. Te quedan " + remainingAttempts
                            + (remainingAttempts == 1 ? " intento." : " intentos."),
                    Map.of("code", "Código incorrecto.")
            );
        }

        activeCode.markUsed();
        codeRepository.save(activeCode);

        user.setVerified(true);
        return userRepository.save(user);
    }

    /**
     * Reenvía un código OTP nuevo respetando el cooldown configurado.
     */
    @Transactional
    public ApiMessageResponse resendCode(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        Optional<User> userOpt = userRepository.findByInstitutionalEmail(email);

        if (userOpt.isEmpty()) {
            return new ApiMessageResponse(
                    true,
                    "Si el correo institucional está pendiente de verificación, enviaremos un nuevo código.",
                    properties.getResendCooldownSeconds()
            );
        }

        User user = userOpt.get();
        if (user.isVerified()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "ALREADY_VERIFIED",
                    "Esta cuenta ya confirmó su correo. Puedes iniciar sesión."
            );
        }

        long cooldown = issueVerificationCode(user, false);
        return new ApiMessageResponse(
                true,
                "Enviamos un nuevo código de 6 dígitos a tu correo institucional.",
                cooldown
        );
    }

    /**
     * Limpieza diaria de códigos expirados y registros no verificados abandonados.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredVerificationData() {
        LocalDateTime now = LocalDateTime.now(clock);
        int deletedCodes = codeRepository.deleteExpiredOrUsedBefore(now.minusHours(24));
        int deletedUsers = userRepository.deleteByVerifiedFalseAndRegistrationDateBefore(
                now.minusHours(properties.getUnverifiedCleanupHours())
        );
        if (deletedCodes > 0 || deletedUsers > 0) {
            log.info("Limpieza de verificación: {} códigos y {} cuentas no verificadas eliminadas.",
                    deletedCodes, deletedUsers);
        }
    }

    private String generateOtpCode() {
        int bound = (int) Math.pow(10, properties.getCodeLength());
        int number = SECURE_RANDOM.nextInt(bound);
        return String.format("%0" + properties.getCodeLength() + "d", number);
    }

    private String hashCode(String normalizedEmail, String code) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(
                    properties.getHashSecret().getBytes(StandardCharsets.UTF_8),
                    HMAC_ALGORITHM
            );
            mac.init(keySpec);
            byte[] digest = mac.doFinal((normalizedEmail + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("No se pudo generar el hash del código de verificación.", ex);
        }
    }

    private String normalizeEmail(String rawEmail) {
        return rawEmail == null ? "" : rawEmail.trim().toLowerCase();
    }
}
