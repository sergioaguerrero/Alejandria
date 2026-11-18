package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.NotificationDto;
import com.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Expone los endpoints REST de notificaciones del usuario autenticado.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> listMyNotifications(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(notificationService.listForUser(currentUser));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(currentUser)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markAsRead(id, currentUser);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal User currentUser
    ) {
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
