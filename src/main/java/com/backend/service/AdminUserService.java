package com.backend.service;

import com.backend.cross.NotificationType;
import com.backend.domain.governance.UserSanction;
import com.backend.domain.identity.User;
import com.backend.dto.AdminUserResponseDto;
import com.backend.exception.AuthException;
import com.backend.repository.AuthUsuariosRepository;
import com.backend.repository.RepositoriosRepository;
import com.backend.repository.UserRepository;
import com.backend.repository.UserSanctionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Operaciones administrativas sobre cuentas de usuario: consulta de historial y suspensión/reactivación
 * invocando funciones y procedimientos de PKG_REPOSITORIOS, PKG_AUTH_USUARIOS y PKG_MODERACION.
 */
@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserSanctionRepository userSanctionRepository;
    private final NotificationService notificationService;
    private final OraclePackageService oraclePackageService;
    private final AuthUsuariosRepository authUsuariosRepository;
    private final RepositoriosRepository repositoriosRepository;

    public AdminUserService(
            UserRepository userRepository,
            UserSanctionRepository userSanctionRepository,
            NotificationService notificationService,
            OraclePackageService oraclePackageService,
            AuthUsuariosRepository authUsuariosRepository,
            RepositoriosRepository repositoriosRepository
    ) {
        this.userRepository = userRepository;
        this.userSanctionRepository = userSanctionRepository;
        this.notificationService = notificationService;
        this.oraclePackageService = oraclePackageService;
        this.authUsuariosRepository = authUsuariosRepository;
        this.repositoriosRepository = repositoriosRepository;
    }

    @Transactional(readOnly = true)
    public AdminUserResponseDto getAdminUser(String idOrUsername, User currentUser) {
        AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden consultar la información de gestión de usuarios.");
        User target = findUserOrThrow(idOrUsername);
        long repoCount = repositoriosRepository.contarReposAutor(target.getId());
        long docCount = repositoriosRepository.contarRecursosAutor(target.getId());
        List<Long> sanctionIds = oraclePackageService.fnSancionesUsuarioIds(target.getId());
        List<UserSanction> sanctions = oraclePackageService.orderByIds(
                sanctionIds,
                userSanctionRepository.findAllById(sanctionIds),
                UserSanction::getId
        );
        return AdminUserResponseDto.fromEntity(target, repoCount, docCount, sanctions);
    }

    @Transactional
    public Map<String, Object> toggleSuspension(String idOrUsername, String rawReason, User currentUser) {
        User admin = AuthGuards.requireAdmin(currentUser, "Solo los administradores pueden suspender o reactivar cuentas.");
        User target = findUserOrThrow(idOrUsername);

        if (target.getId().equals(admin.getId())) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "No puedes suspender tu propia cuenta.");
        }

        String cleanReason = rawReason == null ? "" : rawReason.trim();
        if (cleanReason.length() > 300) {
            cleanReason = cleanReason.substring(0, 300);
        }

        boolean nextSuspended = !target.isSuspended();
        String sanctionReason = !cleanReason.isEmpty()
                ? cleanReason
                : (nextSuspended ? "Suspensión manual por administración" : "Reactivación de cuenta");

        boolean suspendedNow = oraclePackageService.prToggleSuspensionUsuario(
                target.getId(),
                admin.getId(),
                sanctionReason,
                cleanReason.isEmpty() ? null : cleanReason
        );

        notificationService.create(
                target,
                suspendedNow ? NotificationType.SANCTION : NotificationType.SYSTEM,
                suspendedNow ? "Cuenta suspendida" : "Cuenta reactivada",
                suspendedNow
                        ? "Tu cuenta ha sido suspendida. Motivo: " + sanctionReason + "."
                        : "Tu cuenta ha sido reactivada por el equipo de administración.",
                "/terms"
        );

        return Map.of(
                "id", target.getId(),
                "username", target.getUsername(),
                "suspended", suspendedNow
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
            Long id = authUsuariosRepository.buscarUsuarioPorUsername(clean.toLowerCase(Locale.ROOT));
            return (id == null ? java.util.Optional.<User>empty() : userRepository.findById(id))
                    .orElseThrow(() -> new AuthException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
        }
    }
}
