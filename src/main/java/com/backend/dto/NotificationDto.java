package com.backend.dto;

import com.backend.domain.identity.Notification;

import java.time.LocalDateTime;

/**
 * DTO de notificación consumido por NotificationBell y NotificationsPage.
 */
public class NotificationDto {

    private String id;
    private Long userId;
    private String type;
    private String title;
    private String message;
    private String targetUrl;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationDto fromEntity(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setId(String.valueOf(notification.getId()));
        dto.setUserId(notification.getUser() != null ? notification.getUser().getId() : null);
        dto.setType(notification.getType() != null ? notification.getType().toFrontendValue() : "system");
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setTargetUrl(notification.getTargetUrl());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
