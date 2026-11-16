package com.backend.domain.identity;

import jakarta.persistence.*;
import org.hibernate.type.NumericBooleanConverter;

import java.time.LocalDateTime;

/**
 * Almacena el hash de un token temporal de recuperación de contraseña.
 */
@Entity
@Table(
        name = "TOKEN_RECUPERACION_CONTRASENA",
        indexes = {
                @Index(name = "idx_trc_usuario_usado", columnList = "usuario_id, usado"),
                @Index(name = "idx_trc_fecha_expiracion", columnList = "fecha_expiracion")
        }
)
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 128)
    private String tokenHash;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime expiresAt;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "usado", nullable = false)
    private boolean used;

    protected PasswordResetToken() {}

    public PasswordResetToken(User user, String tokenHash, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    public boolean isExpired(LocalDateTime now) {
        return !now.isBefore(expiresAt);
    }

    public void markUsed() {
        this.used = true;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }

    public String getTokenHash() { return tokenHash; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }

    public boolean isUsed() { return used; }
}
