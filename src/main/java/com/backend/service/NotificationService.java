package com.backend.service;

import com.backend.cross.NotificationType;
import com.backend.domain.identity.Notification;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.NotificationDto;
import com.backend.exception.AuthException;
import com.backend.repository.NotificationRepository;
import com.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gestiona la creación, consulta y lectura de notificaciones persistentes
 * invocando las funciones y procedimientos de PKG_AUTH_USUARIOS y PKG_REPOSITORIOS.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final OraclePackageService oraclePackageService;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            OraclePackageService oraclePackageService
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.oraclePackageService = oraclePackageService;
    }

    @Transactional
    public void create(User recipient, NotificationType type, String title, String message, String targetUrl) {
        if (recipient == null || recipient.getId() == null) {
            return;
        }
        Notification notification = new Notification(recipient, type, title, message, targetUrl);
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyFollowersOfNewContent(User author, StudyRepository repo, Resource document) {
        if (author == null || repo == null || document == null) {
            return;
        }

        Map<Long, User> recipients = new LinkedHashMap<>();
        List<Long> repoFollowerIds = oraclePackageService.fnSeguidoresVerificadosRepoIds(repo.getId());
        for (User follower : userRepository.findAllById(repoFollowerIds)) {
            if (!follower.getId().equals(author.getId())) {
                recipients.put(follower.getId(), follower);
            }
        }

        List<Long> authorFollowerIds = oraclePackageService.fnObtenerSeguidoresUsuarioIds(author.getId());
        for (User follower : userRepository.findAllById(authorFollowerIds)) {
            if (!follower.getId().equals(author.getId())) {
                recipients.put(follower.getId(), follower);
            }
        }

        if (recipients.isEmpty()) {
            return;
        }

        String title = "Nuevo documento en " + repo.getName();
        String message = "@" + author.getUsername() + " subió \"" + document.getTitle() + "\".";
        String targetUrl = "/documents/" + document.getId();

        List<Notification> batch = recipients.values().stream()
                .map(recipient -> new Notification(recipient, NotificationType.NEW_CONTENT, title, message, targetUrl))
                .toList();
        notificationRepository.saveAll(batch);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listForUser(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para ver tus notificaciones.");
        List<Long> ids = oraclePackageService.fnListarNotificacionesIds(user.getId());
        return oraclePackageService.orderByIds(ids, notificationRepository.findAllById(ids), Notification::getId)
                .stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tus notificaciones.");
        return notificationRepository.fnContarNotifNoLeidas(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para realizar esta acción.");
        Long validId = notificationRepository.fnObtenerNotificacionUsr(notificationId, user.getId());
        Notification notification = (validId == null ? java.util.Optional.<Notification>empty() : notificationRepository.findById(validId))
                .orElseThrow(() -> new AuthException(
                        HttpStatus.NOT_FOUND,
                        "NOTIFICATION_NOT_FOUND",
                        "Notificación no encontrada."
                ));
        if (!notification.isRead()) {
            notification.markRead();
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(User currentUser) {
        User user = AuthGuards.requireAuthenticated(currentUser, "Debes iniciar sesión para realizar esta acción.");
        oraclePackageService.prMarcarNotificacionesLeidas(user.getId());
    }
}
