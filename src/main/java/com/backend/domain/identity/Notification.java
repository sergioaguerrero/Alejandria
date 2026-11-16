package com.backend.domain.identity;

import com.backend.cross.NotificationType;
import jakarta.persistence.*;
import org.hibernate.type.NumericBooleanConverter;

import java.time.LocalDateTime;

/**
 * Notificación persistente para la bandeja y campanita del usuario.
 */
@Entity
@Table(
        name = "NOTIFICACION",
        indexes = {
                @Index(name = "idx_notif_usuario_fecha", columnList = "usuario_id, fecha_creacion"),
                @Index(name = "idx_notif_usuario_leida", columnList = "usuario_id, leida")
        }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 40)
    private NotificationType type;

    @Column(name = "titulo", nullable = false, length = 200)
    private String title;

    @Column(name = "mensaje", nullable = false, length = 1000)
    private String message;

    @Column(name = "url_destino", length = 500)
    private String targetUrl;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "leida", nullable = false)
    private boolean read;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    protected Notification() {}

    public Notification(User user, NotificationType type, String title, String message, String targetUrl) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.targetUrl = targetUrl;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public void markRead() {
        this.read = true;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }

    public NotificationType getType() { return type; }

    public String getTitle() { return title; }

    public String getMessage() { return message; }

    public String getTargetUrl() { return targetUrl; }

    public boolean isRead() { return read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
