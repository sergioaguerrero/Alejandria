package com.backend.domain.governance;

import com.backend.cross.SanctionType;
import com.backend.domain.identity.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Registra advertencias, suspensiones y reactivaciones aplicadas a una cuenta de usuario.
 */
@Entity
@Table(
        name = "SANCION_USUARIO",
        indexes = @Index(name = "idx_sancion_usuario_fecha", columnList = "usuario_id, fecha_creacion")
)
public class UserSanction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "moderador_id", nullable = false)
    private User moderator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporte_id")
    private Report report;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private SanctionType type;

    @Column(name = "motivo", nullable = false, length = 300)
    private String reason;

    @Column(name = "nota", length = 1000)
    private String note;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    protected UserSanction() {}

    public UserSanction(User user, User moderator, Report report, SanctionType type, String reason, String note) {
        this.user = user;
        this.moderator = moderator;
        this.report = report;
        this.type = type;
        this.reason = reason;
        this.note = note;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public User getModerator() { return moderator; }
    public Report getReport() { return report; }
    public SanctionType getType() { return type; }
    public String getReason() { return reason; }
    public String getNote() { return note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
