package com.backend.service;

import com.backend.config.VerificationProperties;
import com.backend.domain.identity.PasswordResetToken;
import com.backend.domain.identity.User;
import com.backend.exception.AuthException;
import com.backend.repository.PasswordResetTokenRepository;
import com.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Gestiona las solicitudes de recuperación y restablecimiento de contraseña mediante tokens temporales
 * invocando funciones y procedimientos de PKG_AUTH_USUARIOS.
 */
@Service
public class PasswordRecoveryService {

    private static final String INSTITUTIONAL_DOMAIN = "@unicesar.edu.co";
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final int EXPIRATION_MINUTES = 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final String NEUTRAL_RECOVERY_MESSAGE =
            "Si el correo institucional existe en nuestro sistema, te enviamos un enlace de recuperación.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final VerificationProperties verificationProperties;
    private final OraclePackageService oraclePackageService;
    private final com.backend.repository.AuthUsuariosRepository authUsuariosRepository;
    private final String defaultFrontendUrl;

    public PasswordRecoveryService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            VerificationProperties verificationProperties,
            OraclePackageService oraclePackageService,
            com.backend.repository.AuthUsuariosRepository authUsuariosRepository,
            @Value("${app.frontend.url:http://localhost:5173}") String defaultFrontendUrl
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.verificationProperties = verificationProperties;
        this.oraclePackageService = oraclePackageService;
        this.authUsuariosRepository = authUsuariosRepository;
        this.defaultFrontendUrl = defaultFrontendUrl;
    }

    @Transactional
    public Map<String, Object> requestRecovery(String rawEmail, String originHeader) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty() || !email.contains("@")) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Escribe tu correo institucional.",
                    Map.of("email", "Escribe tu correo institucional.")
            );
        }
        if (!email.endsWith(INSTITUTIONAL_DOMAIN)) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Debes ingresar un correo institucional válido (@unicesar.edu.co).",
                    Map.of("email", "Debes ingresar un correo institucional válido (@unicesar.edu.co).")
            );
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", NEUTRAL_RECOVERY_MESSAGE);

        Long userId = authUsuariosRepository.buscarUsuarioPorCorreo(email);
        Optional<User> userOpt = userId == null ? Optional.empty() : userRepository.findById(userId);
        if (userOpt.isPresent() && userOpt.get().isVerified()) {
            User user = userOpt.get();
            oraclePackageService.prInvalidarTokensReset(user.getId());

            String rawToken = generateToken();
            LocalDateTime now = LocalDateTime.now();
            PasswordResetToken resetToken = new PasswordResetToken(
                    user,
                    hashToken(rawToken),
                    now,
                    now.plusMinutes(EXPIRATION_MINUTES)
            );
            tokenRepository.save(resetToken);

            String resetLink = resolveFrontendOrigin(originHeader) + "/reset-password/" + rawToken;
            emailService.sendPasswordResetEmail(
                    user.getInstitutionalEmail(),
                    user.getFirst_name(),
                    resetLink,
                    EXPIRATION_MINUTES
            );
        }

        return response;
    }

    @Transactional
    public Map<String, Object> resetPassword(String rawToken, String newPassword) {
        String cleanToken = rawToken == null ? "" : rawToken.trim();
        if (cleanToken.isEmpty()) {
            throw expiredTokenException();
        }

        String password = newPassword == null ? "" : newPassword;
        if (!AuthService.isValidPassword(password)) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "La contraseña no cumple con los requisitos de seguridad.",
                    Map.of("newPassword", "Debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.")
            );
        }

        Long tokenId = authUsuariosRepository.obtenerTokenResetHash(hashToken(cleanToken));
        PasswordResetToken resetToken = (tokenId == null ? Optional.<PasswordResetToken>empty() : tokenRepository.findById(tokenId))
                .orElseThrow(this::expiredTokenException);

        LocalDateTime now = LocalDateTime.now();
        if (resetToken.isUsed() || resetToken.isExpired(now)) {
            throw expiredTokenException();
        }

        resetToken.markUsed();
        tokenRepository.save(resetToken);

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);

        return Map.of(
                "success", true,
                "message", "Tu contraseña se restableció exitosamente. Ya puedes iniciar sesión."
        );
    }

    private AuthException expiredTokenException() {
        return new AuthException(
                HttpStatus.BAD_REQUEST,
                "TOKEN_EXPIRED",
                "El enlace ha expirado o ya fue utilizado. Solicita uno nuevo."
        );
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return URL_ENCODER.encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            byte[] secret = verificationProperties.getHashSecret().getBytes(StandardCharsets.UTF_8);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("No se pudo calcular el hash del token de recuperación.", ex);
        }
    }

    private String resolveFrontendOrigin(String originHeader) {
        if (originHeader != null && !originHeader.isBlank()) {
            String trimmed = originHeader.trim();
            if (trimmed.startsWith("http://localhost:") || trimmed.startsWith("http://127.0.0.1:")) {
                return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
            }
        }
        return defaultFrontendUrl.endsWith("/")
                ? defaultFrontendUrl.substring(0, defaultFrontendUrl.length() - 1)
                : defaultFrontendUrl;
    }
}
