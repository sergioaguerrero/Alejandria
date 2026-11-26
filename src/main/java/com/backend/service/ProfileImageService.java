package com.backend.service;

import com.backend.cross.ProfileImageType;
import com.backend.domain.identity.User;
import com.backend.domain.identity.UserContact;
import com.backend.dto.UserDto;
import com.backend.exception.AuthException;
import com.backend.repository.UserContactRepository;
import com.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Blob;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Gestiona la subida, eliminación y transmisión en streaming de fotos de perfil (AVATAR)
 * y portadas (BANNER) almacenadas como BLOB en la tabla dedicada IMAGEN_PERFIL_USUARIO
 * sin cargar bytes de imagen en el PersistenceContext de Hibernate.
 */
@Service
public class ProfileImageService {

    private static final Logger log = LoggerFactory.getLogger(ProfileImageService.class);
    private static final int STREAM_BUFFER_SIZE = 64 * 1024;

    public record ImageMetadata(String mimeType, long sizeBytes, LocalDateTime updatedAt) {}

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final UserContactRepository userContactRepository;
    private final OraclePackageService oraclePackageService;
    private final JwtTokenService jwtTokenService;

    public ProfileImageService(
            JdbcTemplate jdbcTemplate,
            UserRepository userRepository,
            UserContactRepository userContactRepository,
            OraclePackageService oraclePackageService,
            JwtTokenService jwtTokenService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.userContactRepository = userContactRepository;
        this.oraclePackageService = oraclePackageService;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional
    public UserDto uploadImage(User currentUser, ProfileImageType type, MultipartFile file) throws IOException {
        User authenticated = AuthGuards.requireAuthenticated(
                currentUser,
                "Debes iniciar sesión para actualizar tu " + type.getDisplayName() + "."
        );

        if (file == null || file.isEmpty()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Selecciona una imagen válida para subir.",
                    Map.of("file", "Selecciona una imagen en formato JPG, PNG o WebP.")
            );
        }

        if (file.getSize() > type.getMaxSizeBytes()) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "La imagen supera el tamaño máximo permitido de " + type.getMaxSizeMegabytes() + " MB.",
                    Map.of("file", "El tamaño máximo para tu " + type.getDisplayName() + " es " + type.getMaxSizeMegabytes() + " MB.")
            );
        }

        byte[] bytes = file.getBytes();
        if (bytes.length == 0) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "El archivo de imagen está vacío.",
                    Map.of("file", "Selecciona una imagen válida.")
            );
        }

        String detectedMime = detectSupportedImageMime(bytes);
        if (detectedMime == null) {
            throw new AuthException(
                    HttpStatus.BAD_REQUEST,
                    "VALIDATION_ERROR",
                    "Formato de imagen no permitido. Usa JPG, PNG o WebP.",
                    Map.of("file", "Solo se permiten imágenes JPG, PNG o WebP.")
            );
        }

        User managedUser = userRepository.findWithRoleById(authenticated.getId())
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "USER_NOT_FOUND",
                        "No se encontró tu cuenta de usuario."
                ));

        LocalDateTime previousTimestamp = type == ProfileImageType.AVATAR
                ? managedUser.getAvatarUpdatedAt()
                : managedUser.getBannerUpdatedAt();
        LocalDateTime now = LocalDateTime.now().truncatedTo(ChronoUnit.MILLIS);
        if (previousTimestamp != null && !now.isAfter(previousTimestamp)) {
            now = previousTimestamp.plus(1, ChronoUnit.MILLIS);
        }
        Timestamp sqlTimestamp = Timestamp.valueOf(now);

        int updated = jdbcTemplate.update(
                "UPDATE IMAGEN_PERFIL_USUARIO SET archivo_bytes = ?, tipo_mime = ?, tamano_bytes = ?, fecha_actualizacion = ? WHERE usuario_id = ? AND tipo = ?",
                ps -> {
                    ps.setBinaryStream(1, new ByteArrayInputStream(bytes), bytes.length);
                    ps.setString(2, detectedMime);
                    ps.setLong(3, bytes.length);
                    ps.setTimestamp(4, sqlTimestamp);
                    ps.setLong(5, managedUser.getId());
                    ps.setString(6, type.name());
                }
        );

        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO IMAGEN_PERFIL_USUARIO (usuario_id, tipo, archivo_bytes, tipo_mime, tamano_bytes, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, ?)",
                    ps -> {
                        ps.setLong(1, managedUser.getId());
                        ps.setString(2, type.name());
                        ps.setBinaryStream(3, new ByteArrayInputStream(bytes), bytes.length);
                        ps.setString(4, detectedMime);
                        ps.setLong(5, bytes.length);
                        ps.setTimestamp(6, sqlTimestamp);
                    }
            );
        }

        if (type == ProfileImageType.AVATAR) {
            managedUser.setAvatarUpdatedAt(now);
        } else {
            managedUser.setBannerUpdatedAt(now);
        }

        User saved = userRepository.save(managedUser);
        jwtTokenService.evictUser(saved.getId());

        return UserDto.fromEntity(saved, loadUserContacts(saved.getId()));
    }

    @Transactional
    public UserDto deleteImage(User currentUser, ProfileImageType type) {
        User authenticated = AuthGuards.requireAuthenticated(
                currentUser,
                "Debes iniciar sesión para eliminar tu " + type.getDisplayName() + "."
        );

        User managedUser = userRepository.findWithRoleById(authenticated.getId())
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "USER_NOT_FOUND",
                        "No se encontró tu cuenta de usuario."
                ));

        jdbcTemplate.update(
                "DELETE FROM IMAGEN_PERFIL_USUARIO WHERE usuario_id = ? AND tipo = ?",
                managedUser.getId(),
                type.name()
        );

        if (type == ProfileImageType.AVATAR) {
            managedUser.setAvatarUpdatedAt(null);
        } else {
            managedUser.setBannerUpdatedAt(null);
        }

        User saved = userRepository.save(managedUser);
        jwtTokenService.evictUser(saved.getId());

        return UserDto.fromEntity(saved, loadUserContacts(saved.getId()));
    }

    @Transactional(readOnly = true)
    public ImageMetadata getImageMetadata(Long userId, ProfileImageType type) {
        if (userId == null) {
            throw imageNotFound(type);
        }
        List<ImageMetadata> rows = jdbcTemplate.query(
                "SELECT tipo_mime, tamano_bytes, fecha_actualizacion FROM IMAGEN_PERFIL_USUARIO WHERE usuario_id = ? AND tipo = ?",
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp(3);
                    return new ImageMetadata(
                            rs.getString(1),
                            rs.getLong(2),
                            ts != null ? ts.toLocalDateTime() : null
                    );
                },
                userId,
                type.name()
        );
        if (rows.isEmpty()) {
            throw imageNotFound(type);
        }
        return rows.get(0);
    }

    @Transactional(readOnly = true)
    public void streamImageBytes(Long userId, ProfileImageType type, OutputStream out) {
        Boolean found = jdbcTemplate.query(
                "SELECT archivo_bytes FROM IMAGEN_PERFIL_USUARIO WHERE usuario_id = ? AND tipo = ?",
                ps -> {
                    ps.setLong(1, userId);
                    ps.setString(2, type.name());
                },
                rs -> {
                    if (!rs.next()) {
                        return false;
                    }
                    Blob blob = rs.getBlob(1);
                    if (blob == null) {
                        return true;
                    }
                    try (InputStream in = blob.getBinaryStream()) {
                        byte[] buffer = new byte[STREAM_BUFFER_SIZE];
                        int read;
                        while ((read = in.read(buffer)) != -1) {
                            out.write(buffer, 0, read);
                        }
                        out.flush();
                    } catch (IOException ex) {
                        log.debug("Stream cerrado por el cliente durante transferencia de {} del usuario {}: {}",
                                type, userId, ex.getMessage());
                    } finally {
                        try {
                            blob.free();
                        } catch (Exception ignored) {
                        }
                    }
                    return true;
                }
        );

        if (!Boolean.TRUE.equals(found)) {
            throw imageNotFound(type);
        }
    }

    /**
     * Valida la firma binaria (magic bytes) para aceptar únicamente JPEG, PNG o WebP genuinos.
     */
    static String detectSupportedImageMime(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return null;
        }
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return "image/png";
        }
        // WebP: "RIFF" .... "WEBP"
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private List<UserContact> loadUserContacts(Long userId) {
        List<Long> ids = oraclePackageService.fnContactosUsuarioIds(userId);
        return oraclePackageService.orderByIds(ids, userContactRepository.findAllById(ids), UserContact::getId);
    }

    private AuthException imageNotFound(ProfileImageType type) {
        return new AuthException(
                HttpStatus.NOT_FOUND,
                "IMAGE_NOT_FOUND",
                "El usuario no tiene " + type.getDisplayName() + " configurada."
        );
    }
}
