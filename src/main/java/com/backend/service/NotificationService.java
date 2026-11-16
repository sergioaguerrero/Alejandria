package com.backend.service;

import com.backend.cross.NotificationType;
import com.backend.domain.identity.Notification;
import com.backend.domain.identity.User;
import com.backend.domain.repos.Resource;
import com.backend.domain.repos.StudyRepository;
import com.backend.dto.NotificationDto;
import com.backend.exception.AuthException;
import com.backend.repository.NotificationRepository;
import com.backend.repository.RepositoryFollowRepository;
import com.backend.repository.UserFollowRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gestiona la creación, consulta y lectura de notificaciones persistentes.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserFollowRepository userFollowRepository;
    private final RepositoryFollowRepository repositoryFollowRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserFollowRepository userFollowRepository,
            RepositoryFollowRepository repositoryFollowRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userFollowRepository = userFollowRepository;
        this.repositoryFollowRepository = repositoryFollowRepository;
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
        for (User follower : repositoryFollowRepository.findFollowerUsersByRepositoryId(repo.getId())) {
            if (!follower.getId().equals(author.getId())) {
                recipients.put(follower.getId(), follower);
            }
        }
        for (User follower : userFollowRepository.findFollowerUsers(author.getId())) {
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
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para ver tus notificaciones.");
        return notificationRepository.findByUserIdOrderByCreatedAtDescIdDesc(user.getId()).stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public long countUnread(User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para consultar tus notificaciones.");
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User currentUser) {
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para realizar esta acción.");
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
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
        User user = requireAuthenticated(currentUser, "Debes iniciar sesión para realizar esta acción.");
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    private User requireAuthenticated(User user, String message) {
        if (user == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
        }
        return user;
    }
}
