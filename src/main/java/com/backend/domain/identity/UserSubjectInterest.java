package com.backend.domain.identity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Representa una materia marcada como de interés por un usuario.
 */
@Entity
@Table(name = "USUARIO_MATERIA_INTERES")
public class UserSubjectInterest {

    @EmbeddedId
    private UserSubjectInterestId id;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime createdAt;

    protected UserSubjectInterest() {}

    public UserSubjectInterest(Long userId, Long subjectId) {
        this.id = new UserSubjectInterestId(userId, subjectId);
        this.createdAt = LocalDateTime.now();
    }

    public UserSubjectInterestId getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
