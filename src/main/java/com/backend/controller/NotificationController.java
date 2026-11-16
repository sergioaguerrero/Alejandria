package com.backend.controller;

import com.backend.domain.identity.User;
import com.backend.dto.NotificationDto;
import com.backend.service.JwtTokenService;
import com.backend.service.NotificationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
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
    private final JwtTokenService jwtTokenService;

    public NotificationController(NotificationService notificationService, JwtTokenService jwtTokenService) {
        this.notificationService = notificationService;
        this.jwtTokenService = jwtTokenService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> listMyNotifications(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(notificationService.listForUser(resolveUser(authorization)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(resolveUser(authorization))));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long id,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        notificationService.markAsRead(id, resolveUser(authorization));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization
    ) {
        notificationService.markAllAsRead(resolveUser(authorization));
        return ResponseEntity.ok(Map.of("success", true));
    }

    private User resolveUser(String authorization) {
        return jwtTokenService.resolveUserFromAuthorizationHeader(authorization).orElse(null);
    }
}
