package com.backend.domain.identity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Almacena el hash de un código OTP de verificación enviado al correo institucional.
 */
@Entity
@Table(
        name = "EMAIL_VERIFICATION_CODE",
        indexes = {
                @Index(name = "idx_evc_user_used", columnList = "user_id, used"),
                @Index(name = "idx_evc_expires_at", columnList = "expires_at")
        }
)
public class EmailVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "code_hash", nullable = false, length = 128)
    private String codeHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
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
