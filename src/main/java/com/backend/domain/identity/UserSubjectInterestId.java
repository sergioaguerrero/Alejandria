package com.backend.domain.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;

/**
 * Clave primaria compuesta para la relación usuario → materia de interés.
 */
@Embeddable
public class UserSubjectInterestId implements Serializable {

    @Column(name = "usuario_id", nullable = false)
    private Long userId;

    @Column(name = "materia_id", nullable = false)
    private Long subjectId;

    protected UserSubjectInterestId() {}

    public UserSubjectInterestId(Long userId, Long subjectId) {
        this.userId = userId;
        this.subjectId = subjectId;
    }

    public Long getUserId() { return userId; }
    public Long getSubjectId() { return subjectId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserSubjectInterestId that)) return false;
        return Objects.equals(userId, that.userId) && Objects.equals(subjectId, that.subjectId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, subjectId);
    }
}
