package com.backend.domain.identity;

import jakarta.persistence.*;
import org.hibernate.type.NumericBooleanConverter;
import java.time.LocalDateTime;

/**
 * Almacena el hash de un código OTP de verificación enviado al correo institucional.
 */
@Entity
@Table(
        name = "CODIGO_VERIFICACION_CORREO",
        indexes = {
                @Index(name = "idx_cvc_usuario_usado", columnList = "usuario_id, usado"),
                @Index(name = "idx_cvc_fecha_expiracion", columnList = "fecha_expiracion")
        }
)
public class EmailVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Column(name = "codigo_hash", nullable = false, length = 128)
    private String codeHash;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "intentos", nullable = false)
    private int attempts;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "usado", nullable = false)
    private boolean used;

    protected EmailVerificationCode() {}

    public EmailVerificationCode(User user, String codeHash, LocalDateTime createdAt, LocalDateTime expiresAt) {
        this.user = user;
        this.codeHash = codeHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.attempts = 0;
        this.used = false;
    }

    public boolean isExpired(LocalDateTime now) {
        return !now.isBefore(expiresAt);
    }

    public void incrementAttempts() {
        this.attempts += 1;
    }

    public void markUsed() {
        this.used = true;
    }

    public Long getId() { return id; }

    public User getUser() { return user; }

    public String getCodeHash() { return codeHash; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getExpiresAt() { return expiresAt; }

    public int getAttempts() { return attempts; }

    public boolean isUsed() { return used; }
}
