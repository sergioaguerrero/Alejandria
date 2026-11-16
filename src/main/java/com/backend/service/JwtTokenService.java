package com.backend.service;

import com.backend.domain.identity.User;
import com.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Emite y valida tokens JWT HS256 firmados con HMAC-SHA256 sin dependencias externas.
 */
@Service
public class JwtTokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final byte[] secretBytes;
    private final long expirationMillis;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    public JwtTokenService(
            @Value("${jwt.secret:alejandria-dev-jwt-secret-change-in-production}") String secret,
            @Value("${jwt.expiration:86400000}") long expirationMillis,
            ObjectMapper objectMapper,
            UserRepository userRepository
    ) {
        this.secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMillis = expirationMillis;
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
    }

    public String generateToken(User user) {
        try {
            long issuedAt = Instant.now().getEpochSecond();
            long expiresAt = issuedAt + Math.max(1L, expirationMillis / 1000L);

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", String.valueOf(user.getId()));
            payload.put("username", user.getUsername());
            payload.put("email", user.getInstitutionalEmail());
            payload.put("role", user.getRole() != null ? user.getRole().getName() : "ESTUDIANTE");
            payload.put("iat", issuedAt);
            payload.put("exp", expiresAt);

            String encodedHeader = URL_ENCODER.encodeToString(HEADER_JSON.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(payload));
            String signingInput = encodedHeader + "." + encodedPayload;
            String signature = sign(signingInput);

            return signingInput + "." + signature;
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo generar el token de sesión.", ex);
        }
    }

    public Optional<User> resolveUserFromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring(7).trim();
        if (token.isEmpty()) {
            return Optional.empty();
        }
        return resolveUserFromToken(token);
    }

    public Optional<User> resolveUserFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSig = signBytes(signingInput);
            byte[] actualSig = URL_DECODER.decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                return Optional.empty();
            }

            byte[] payloadBytes = URL_DECODER.decode(parts[1]);
            Map<String, Object> claims = objectMapper.readValue(payloadBytes, new TypeReference<>() {});
            Object expObj = claims.get("exp");
            if (!(expObj instanceof Number expNum) || Instant.now().getEpochSecond() >= expNum.longValue()) {
                return Optional.empty();
            }

            Object subObj = claims.get("sub");
            if (subObj == null) {
                return Optional.empty();
            }
            Long userId = Long.parseLong(String.valueOf(subObj));
            return userRepository.findById(userId)
                    .filter(user -> !user.isSuspended());
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private String sign(String signingInput) throws GeneralSecurityException {
        return URL_ENCODER.encodeToString(signBytes(signingInput));
    }

    private byte[] signBytes(String signingInput) throws GeneralSecurityException {
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        mac.init(new SecretKeySpec(secretBytes, HMAC_ALGORITHM));
        return mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
    }
}
