package com.backend.service;

import com.backend.cross.NotificationType;
import com.backend.cross.SanctionType;
import com.backend.domain.governance.UserSanction;
import com.backend.domain.identity.User;
import com.backend.dto.AdminUserResponseDto;
import com.backend.exception.AuthException;
import com.backend.repository.ResourceRepository;
import com.backend.repository.StudyRepositoryRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSanctionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Operaciones administrativas sobre cuentas de usuario: consulta de historial y suspensión/reactivación.
 */
@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final StudyRepositoryRepository studyRepositoryRepository;
    private final ResourceRepository resourceRepository;
    private final NotificationService notificationService;

    public AdminUserService(
            UserRepository userRepository,
            UserSanctionRepository userSanctionRepository,
            StudyRepositoryRepository studyRepositoryRepository,
            ResourceRepository resourceRepository,
            NotificationService notificationService
    ) {
        this.userRepository = userRepository;
        this.userSanctionRepository = userSanctionRepository;
        this.studyRepositoryRepository = studyRepositoryRepository;
        this.resourceRepository = resourceRepository;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public AdminUserResponseDto getAdminUser(String idOrUsername, User currentUser) {
        AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden consultar la información de gestión de usuarios.");
        User target = findUserOrThrow(idOrUsername);
        long repoCount = studyRepositoryRepository.countByAuthorId(target.getId());
        long docCount = resourceRepository.countByUploadedById(target.getId());
        List<UserSanction> sanctions = userSanctionRepository.findByUserIdWithModeratorOrderByCreatedAtDesc(target.getId());
        return AdminUserResponseDto.fromEntity(target, repoCount, docCount, sanctions);
    }

    @Transactional
    public Map<String, Object> toggleSuspension(String idOrUsername, String rawReason, User currentUser) {
        User admin = AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden suspender o reactivar cuentas.");
        User target = findUserOrThrow(idOrUsername);

        if (target.getId().equals(admin.getId())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "No puedes suspender tu propia cuenta.");
        }

        boolean nextSuspended = !target.isSuspended();
        target.setSuspended(nextSuspended);
        userRepository.save(target);

        String cleanReason = rawReason == null ? "" : rawReason.trim();
        if (cleanReason.length() > 300) {
            cleanReason = cleanReason.substring(0, 300);
        }

        String sanctionReason = !cleanReason.isEmpty()
                ? cleanReason
                : (nextSuspended ? "Suspensión manual por administración" : "Reactivación de cuenta");

        userSanctionRepository.save(new UserSanction(
                target,
                admin,
                null,
                nextSuspended ? SanctionType.SUSPENSION : SanctionType.REACTIVACION,
                sanctionReason,
                cleanReason.isEmpty() ? null : cleanReason
        ));

        notificationService.create(
                target,
                nextSuspended ? NotificationType.SANCTION : NotificationType.SYSTEM,
                nextSuspended ? "Cuenta suspendida" : "Cuenta reactivada",
                nextSuspended
                        ? "Tu cuenta ha sido suspendida. Motivo: " + sanctionReason + "."
                        : "Tu cuenta ha sido reactivada por el equipo de administración.",
                "/terms"
        );

        return Map.of(
                "id", target.getId(),
                "username", target.getUsername(),
                "suspended", target.isSuspended()
        );
    }

    private User findUserOrThrow(String idOrUsername) {
        if (idOrUsername == null || idOrUsername.isBlank()) {
            throw new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado.");
        }
        String clean = idOrUsername.trim();
        try {
            Long id = Long.parseLong(clean);
            return userRepository.findById(id)
                    .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
        } catch (NumberFormatException ignored) {
            return userRepository.findByUsernameIgnoreCase(clean.toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
        }
    }
}
